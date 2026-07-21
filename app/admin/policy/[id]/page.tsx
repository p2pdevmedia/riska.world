import { AdminConsole } from "@/components/AdminConsole";
export default function AdminPolicyPage({ params }: { params: { id: string } }) { return <AdminConsole view="policy" policyId={params.id} />; }
