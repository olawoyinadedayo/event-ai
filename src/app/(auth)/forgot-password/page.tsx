import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const initialError =
    error === "invalid_link"
      ? "That reset link is invalid or has expired. Request a new one."
      : null;

  return <ForgotPasswordForm initialError={initialError} />;
}
