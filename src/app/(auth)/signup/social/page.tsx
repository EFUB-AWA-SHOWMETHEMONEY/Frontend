import SignupForm from '@/components/signup/SignupForm';

// TODO(API 연동): 소셜 로그인 후 받은 임시 가입 토큰이 없으면 /login 으로 이동
export default function SocialSignupPage() {
  return <SignupForm type="social" />;
}
