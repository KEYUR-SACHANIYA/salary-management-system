import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";

export default function EmployeeNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Employee not found" />
      <p className="text-sm text-slate-600">
        That employee does not exist or the link is no longer valid.
      </p>
      <p className="mt-4">
        <Link href="/employees" className="text-sm font-medium text-slate-900 underline">
          Back to employees
        </Link>
      </p>
    </PageContainer>
  );
}
