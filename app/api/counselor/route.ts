import { meili } from '@/lib/meilisearch';
import { streamText, generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is missing in process.env!");
      return new Response(JSON.stringify({ error: "GROQ_API_KEY environment variable is not configured on server." }), { status: 500 });
    }

    const groq = createGroq({ apiKey });

    const payload = await req.json();
    console.log("Chat API Payload:", payload);
    
    let rawMessages = payload.messages || [];
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      const singleText = payload.prompt || payload.message || payload.text || (typeof payload === 'string' ? payload : '');
      if (singleText) {
        rawMessages = [{ role: 'user', content: singleText }];
      }
    }

    // Normalize messages safely for older clients vs newer AI SDK
    const messages = rawMessages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || m.text || (m.parts?.map((p: any) => p.text).join('')) || ''
    })).filter((m: any) => m.content.trim().length > 0);

    const lastMessage = messages[messages.length - 1];
    const latestMessageText = lastMessage?.content || '';

    const lowerLatest = latestMessageText.toLowerCase().trim();

    // 2. EXTRACTION PROMPT (Fast intent & query extraction with deterministic overrides)
    let extractedData = { intent: "GENERAL", query: "", locationString: "", lat: null as number | null, lng: null as number | null };

    if (lowerLatest.includes("resume") || lowerLatest.includes("cv")) {
      extractedData.intent = "RESUME";
    } else if (lowerLatest.includes("career guidance") || lowerLatest.includes("aptitude") || lowerLatest.includes("career option") || lowerLatest.includes("career path")) {
      extractedData.intent = "APTITUDE";
    } else {
      const extractionPrompt = `You are an intent router for AcademyFind.
CRITICAL: Do NOT output <think> tags or any reasoning. Respond directly.
      Analyze the user's message and determine the intent:
      - COACHING: The user is looking for coaching, schools, institutes, exam prep (JEE, NEET, UPSC, SSC, etc.), or tutors.
      - APTITUDE: The user wants career guidance, stream choice, or aptitude help based on interests.
      - RESUME: The user wants help building, reviewing, or improving a resume/CV.
      - GENERAL: Anything else.
      
      If COACHING, extract the core subject and specific location if mentioned (try to provide approximate lat/lng if a specific area is named, else null).
      
      You MUST return ONLY a valid JSON object. No markdown block, no extra text.
      Format:
      {
        "intent": "COACHING" | "APTITUDE" | "RESUME" | "GENERAL",
        "query": "core topic (e.g., UPSC coaching, or null)",
        "locationString": "city or area (or null)",
        "lat": 28.6215, // float or null
        "lng": 77.3639  // float or null
      }`;

      let jsonText = "";
      try {
        const result = await generateText({
          model: groq('openai/gpt-oss-120b') as any,
          system: extractionPrompt,
          prompt: latestMessageText,
        });
        jsonText = result.text;

        // Strip <think>...</think> tags (Qwen reasoning output) and markdown code fences
        const cleanJson = jsonText
          .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        extractedData = JSON.parse(cleanJson);
      } catch (e) {
        console.log("Failed to parse intent JSON, falling back to GENERAL.", (e as Error).message);
        console.log("Raw AI Output was:", jsonText);
      }
    }

    // Preserve ongoing counseling context if latest AI router returned GENERAL
    if (extractedData.intent === "GENERAL" && messages.length > 1) {
      const pastText = messages.slice(0, -1).map((m: any) => m.content || '').join(' ').toLowerCase();
      if (pastText.includes("resume") || pastText.includes("cv")) {
        extractedData.intent = "RESUME";
      } else if (pastText.includes("career guidance") || pastText.includes("aptitude")) {
        extractedData.intent = "APTITUDE";
      }
    }

    console.log("Counselor AI Extracted Intent:", extractedData);

    let systemPrompt = "";

    // 3. BUILD DYNAMIC SYSTEM PROMPT BASED ON INTENT
    if (extractedData.intent === "COACHING") {
      let cleanHitsForAI: any[] = [];
      try {
        const index = meili.index('global_search');
        let sortOptions: string[] = [];

        // Geo-sorting if location was extracted
        if (extractedData.lat !== null && extractedData.lng !== null) {
          sortOptions = [`_geoPoint(${extractedData.lat}, ${extractedData.lng}):asc`];
        }

        // 🚀 Include location in the query string so MeiliSearch's text ranking factors it in!
        let finalSearchQuery = extractedData.query || latestMessageText;
        if (extractedData.query && extractedData.locationString) {
            finalSearchQuery = `${extractedData.query} ${extractedData.locationString}`;
        }

        // Search the actual AcademyFind Database
        const searchResults = await index.search(finalSearchQuery, {
          limit: 5,
          filter: "type IN ['institute', 'school', 'tutor', 'job']",
          attributesToRetrieve: ['type', 'name', 'city', 'citySlug', 'description', 'address', 'categoryNames', 'categorySlugs', 'averageRating', 'googleRating', 'url', '_geo'],
          sort: sortOptions.length > 0 ? sortOptions : undefined,
          hybrid: { semanticRatio: 0.6, embedder: 'default' }
        });

        const hits = searchResults.hits as any[];
        cleanHitsForAI = hits
          .filter(h => ['institute', 'school', 'tutor', 'job'].includes(h.type))
          .map(h => ({
            name: h.name,
            address: h.address,
            city: h.city,
            rating: h.googleRating || h.averageRating || 'N/A',
            categories: h.categoryNames,
            url: h.url,
            exploreLink: `/${h.citySlug}/${h.categorySlugs?.[0] || 'all-categories'}`
          }));
      } catch (meiliErr) {
        console.warn("Meilisearch lookup skipped (unreachable in current environment):", (meiliErr as Error).message);
      }

      const searchContext = JSON.stringify(cleanHitsForAI);

      systemPrompt = `You are 'AcademyFind AI', an expert counselor.
CRITICAL: Do NOT output <think> tags or any reasoning. Respond directly.
        DATABASE CONTEXT:
        ---
        ${searchContext}
        ---
        STRICT RULES:
        1. ONLY base your coaching recommendations on the DATABASE CONTEXT. If the context is empty, say we don't have exact matches but give general advice.
        2. Format institutes exactly like this:
           - **[Name]** — [City] · ★[rating] — [View Details]([url])
        3. At the end, add an explore link using exploreLink from context.
        4. Make links valid markdown.
        5. Be conversational but concise. Keep responses SHORT.
        6. Just Output the final answer no thinking or anything no reasoning of ai model should be displayed to user on frontend`;

    } else if (extractedData.intent === "APTITUDE") {
      systemPrompt = `You are 'AcademyFind AI', a genuine and empathetic Senior Career Counselor.
CRITICAL: Do NOT output <think> tags or any reasoning. Respond directly.

YOUR COUNSELING FLOW:
1. If the user just asked for "Career guidance" or provided minimal information:
   - Greet them warmly and ask 2-3 quick questions:
     a) What is your current level? (10th/12th student, College student, Graduate, or Working professional)
     b) What stream or subjects do you enjoy most?
     c) What is your primary goal? (e.g. Corporate tech job, Government exams, Studying abroad, Creative field)

2. If the user has provided their background and goals:
   - Give a structured, step-by-step career path recommendation:
     - 🎯 **Top Recommended Career Paths** (2-3 fields best suited for them with reasons)
     - 🚀 **Key Actionable Next Steps** (Entrance exams, essential skills, or degree/certifications needed)
     - 📈 **Growth Outlook** (Brief future scope)
   - Ask if they would like recommendations for coaching institutes or online courses for any of these paths.

Keep responses encouraging, structured with bullet points, and conversational.`;

    } else if (extractedData.intent === "RESUME") {
      systemPrompt = `You are 'AcademyFind AI', an expert Resume Builder & Reviewer.
CRITICAL: Do NOT output <think> tags or any reasoning. Respond directly.
STRICT RULE: NEVER ask the user to paste text if they uploaded or attached a resume file!

YOUR COUNSELING FLOW:
1. If the user attached a file or mentioned a target role (e.g. SDE, Software Engineer, Data Analyst, Marketing):
   - Acknowledge the uploaded document name and target role warmly.
   - Analyze the extracted resume content / user details thoroughly.
   - **Step 1: Resume Critique & Flaws**: Point out 3 specific flaws (e.g. missing metrics, weak action verbs, unoptimized technical skills for ATS, vague project outcomes).
   - **Step 2: Key Recommendations**: Provide actionable fixes tailored specifically for their target role.
   - **Step 3: ATS-Optimized Resume Draft**: Output a full, high-impact ATS-friendly Markdown resume ready for them to use.

Keep responses professional, constructive, and highly valuable.`;

    } else {
      systemPrompt = `You are AcademyFind AI, a friendly and concise assistant.
CRITICAL: Do NOT output <think> tags or any reasoning. Respond directly.
You help users find coaching institutes, get career guidance, or build resumes.
For greetings like "hi/hello", reply in 1-2 short sentences: greet back warmly and ask what they need help with. Do NOT list services unless asked. Keep it very brief.`;
    }

    // 4. GENERATE FINAL RESPONSE
    const result = streamText({
      model: groq('openai/gpt-oss-120b') as any,
      system: systemPrompt,
      messages: messages as any,
      maxTokens: 4096,
    } as any);

    const res = result as any;
    if (typeof res.toDataStreamResponse === 'function') {
      return res.toDataStreamResponse();
    }
    if (typeof res.toUIMessageStreamResponse === 'function') {
      return res.toUIMessageStreamResponse();
    }
    return res.toTextStreamResponse();

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
