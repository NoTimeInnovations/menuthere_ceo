import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export function SeedStatuses() {
  const seedStatuses = useMutation(api.statuses.seedDefaults);
  const seedCustomers = useMutation(api.customers.seedCustomersIfEmpty);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      await seedStatuses();
      await seedCustomers();
    })();
  }, [seedStatuses, seedCustomers]);

  return null;
}
