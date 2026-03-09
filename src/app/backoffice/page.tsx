import { redirect } from "next/navigation";

export default function BackofficeRedirectPage() {
  redirect("/bo/dashboard");
}
