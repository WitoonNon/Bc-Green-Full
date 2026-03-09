import { redirect } from "next/navigation";

export default function BackofficeIndexPage() {
  redirect("/bo/dashboard");
}
