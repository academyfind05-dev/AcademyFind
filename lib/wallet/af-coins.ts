export const AF_COINS_EARN = {
  SIGN_UP: 5,
  VERIFY_MOBILE: 1,
  COMPLETE_PROFILE: 2, // including profile pic
  JOIN_STUDENT_TEACHER: 2,
  RATING: 1,
  WRITE_REVIEW: 5,
  REVIEW_LIKE_REPLY: 1, // Get like/reply on your review
  DO_LIKE_REPLY_REVIEW: 1, // Do like/reply on other's review
  UPLOAD_INSTITUTE_MEDIA: 2,
  REPORT_INCORRECT_INFO: 2,
  WRITE_BLOG: 5,
  INVITE_FRIEND_SIGNUP: 5,
  DAILY_LOGIN_STREAK: 1, // 7+ days straight = 1/day
  REPLY_MESSAGE: 1,
} as const;

export const AF_COINS_USE = {
  SEE_CONTACT_BASIC_INSTITUTE: 1,
  MESSAGE_OTHER_USER: 1,
  RESUME_REVIEW: 20,
  INTERVIEW_GUIDANCE: 20,
  COLLEGE_COUNSELLING: 100,
  CARRIER_COUNSELLING: 100,
  UPSC_STRATEGY_SESSION: 50,
  SEE_STUDENT_PROFILE_BASIC: 1,
  SEE_TEACHER_PROFILE_BASIC: 1,
  // Institute discounts = depends on case (handled dynamically)
} as const;

export const AFC_PRICING = [
  { id: "pack_19", afc: 1, price: 19 },
  { id: "pack_99", afc: 10, price: 99 },
  { id: "pack_149", afc: 20, price: 149 },
  { id: "pack_299", afc: 50, price: 299 },
  { id: "pack_449", afc: 100, price: 449 },
];
