import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { fn } from "storybook/test";
import { SignInForm } from "./SignInForm";

const meta = {
  title: "Auth/SignInForm",
  decorators: (Story) => (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Story />
      </div>
    </div>
  ),
  component: SignInForm,
  args: {
    mode: "sign-in",
    onModeChange: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof SignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {};

export const SignUp: Story = {
  args: { mode: "sign-up" },
};

export const WithError: Story = {
  args: { error: "Invalid email or password" },
};
