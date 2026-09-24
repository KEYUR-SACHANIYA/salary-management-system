import { EmployeeDirectoryClient } from "@/components/employees/EmployeeDirectoryClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await searchParams;

  return <EmployeeDirectoryClient />;
}
