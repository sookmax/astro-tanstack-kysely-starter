import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { fn } from "storybook/test";
import type { Entry } from "@/lib/schemas/entry.schema";
import { EntryCard } from "./EntryCard";

const entry: Entry = {
  id: 1,
  body: "Hello from Storybook! Components here are the same ones the app renders.",
  created_at: new Date("2026-10-26T12:00:00Z"),
  likes_count: 3,
  author: { id: "u1", name: "Ada", image: null },
  is_liked: false,
  is_author: false,
};

const meta = {
  title: "Entries/EntryCard",
  decorators: (Story) => (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Story />
      </div>
    </div>
  ),
  component: EntryCard,
  args: {
    entry,
    linkToEntry: false,
    onToggleLike: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof EntryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Liked: Story = {
  args: { entry: { ...entry, is_liked: true, likes_count: 4 } },
};

// the author sees Delete
export const OwnEntry: Story = {
  args: { entry: { ...entry, is_author: true } },
};

export const SeedEntry: Story = {
  args: { entry: { ...entry, author: null, likes_count: 0 } },
};

export const LongBody: Story = {
  args: {
    entry: {
      ...entry,
      body: "A much longer entry that wraps across several lines, to check spacing and wrapping. ".repeat(
        3,
      ),
    },
  },
};
