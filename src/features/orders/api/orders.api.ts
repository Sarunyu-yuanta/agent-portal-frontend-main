/**
 * Order Management's initial state.
 *
 * `OrdersProvider` (the write side) starts from this snapshot and mutates it in
 * memory. With a backend, each list becomes an endpoint the store loads, and
 * each store mutator becomes a request followed by a refetch — see
 * docs/architecture.md, "Write side".
 */

export {
  BACKOFFICE_ACTOR,
  ORDER_ACTOR,
  clientNameById,
  seedBookings,
  seedOfferedProposals,
  seedProposals,
  seedRequirementRequests,
  seedSubmissions,
} from "@/mocks/order-mock-data";
