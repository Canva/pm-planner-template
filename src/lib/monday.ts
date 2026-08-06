const MONDAY_API_URL = "https://api.monday.com/v2";

interface MondayItem {
  id: string;
  name: string;
  group: { id: string; title: string };
  column_values: Array<{
    id: string;
    title: string;
    text: string;
    value: string;
  }>;
  updates: Array<{
    id: string;
    body: string;
    created_at: string;
    creator: { name: string };
  }>;
}

export async function mondayQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  apiToken?: string
): Promise<T> {
  const token = apiToken || process.env.MONDAY_API_TOKEN;
  if (!token) throw new Error("Monday.com API token not configured");

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

export async function getIntakeItems(boardId: string, apiToken?: string): Promise<MondayItem[]> {
  const query = `
    query GetIntakeItems($boardId: ID!) {
      boards(ids: [$boardId]) {
        groups(ids: ["intake"]) {
          id
          title
          items_page(limit: 100) {
            items {
              id
              name
              group { id title }
              column_values {
                id title text value
              }
              updates(limit: 5) {
                id body created_at
                creator { name }
              }
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery<{
    boards: Array<{
      groups: Array<{ items_page: { items: MondayItem[] } }>;
    }>;
  }>(query, { boardId }, apiToken);

  return data.boards[0]?.groups[0]?.items_page?.items ?? [];
}

export async function getBoardItems(boardId: string, apiToken?: string): Promise<MondayItem[]> {
  const query = `
    query GetBoardItems($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 500) {
          items {
            id
            name
            group { id title }
            column_values {
              id title text value
            }
            updates(limit: 3) {
              id body created_at
              creator { name }
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery<{
    boards: Array<{ items_page: { items: MondayItem[] } }>;
  }>(query, { boardId }, apiToken);

  return data.boards[0]?.items_page?.items ?? [];
}

export async function updateMondayItem(
  boardId: string,
  itemId: string,
  columnValues: Record<string, unknown>,
  apiToken?: string
): Promise<void> {
  const mutation = `
    mutation UpdateItem($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId
        item_id: $itemId
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  await mondayQuery(
    mutation,
    { boardId, itemId, columnValues: JSON.stringify(columnValues) },
    apiToken
  );
}

export function parseMondayItem(item: MondayItem): Partial<import("@/types").Task> {
  const getColumnValue = (title: string) =>
    item.column_values.find((c) => c.title.toLowerCase().includes(title.toLowerCase()))?.text;

  const dueDateRaw = getColumnValue("due") || getColumnValue("deadline");
  const statusRaw = getColumnValue("status");
  const effortRaw = getColumnValue("effort") || getColumnValue("priority");

  return {
    mondayItemId: item.id,
    name: item.name,
    status: mapMondayStatus(statusRaw),
    effort: mapMondayEffort(effortRaw),
    dueDate: dueDateRaw ? new Date(dueDateRaw).toISOString() : undefined,
    mondayUpdates: item.updates.map((u) => ({
      id: u.id,
      body: u.body,
      createdAt: u.created_at,
      creator: { name: u.creator.name },
    })),
  };
}

function mapMondayStatus(status?: string): import("@/types").TaskStatus {
  if (!status) return "INTAKE";
  const s = status.toLowerCase();
  if (s.includes("progress") || s.includes("working")) return "IN_PROGRESS";
  if (s.includes("review")) return "REVIEW";
  if (s.includes("blocked") || s.includes("stuck")) return "BLOCKED";
  if (s.includes("done") || s.includes("complete")) return "DONE";
  if (s.includes("cancel")) return "CANCELLED";
  return "INTAKE";
}

function mapMondayEffort(value?: string): import("@/types").Effort {
  if (!value) return 2;
  const v = value.toLowerCase();
  if (v.includes("3") || v.includes("heavy") || v.includes("urgent") || v.includes("critical") || v.includes("high")) return 3;
  if (v.includes("1") || v.includes("light") || v.includes("low")) return 1;
  return 2;
}
