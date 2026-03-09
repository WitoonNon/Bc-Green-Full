import { redirect } from "next/navigation";

export default function RepairsRedirectPage() {
  redirect("/tickets/new");
}
