import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { fn } from "storybook/test";
import { EntryComposer } from "./EntryComposer";

const meta = {
  title: "Entries/EntryComposer",
  decorators: (Story) => (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        <Story />
      </div>
    </div>
  ),
  component: EntryComposer,
  args: { onSubmit: fn() },
} satisfies Meta<typeof EntryComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: { pending: true },
};

export const ServerError: Story = {
  args: { error: "Sign in required" },
};
