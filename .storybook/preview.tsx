import type { Preview } from "@storybook/tanstack-react";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import "@/styles/global.css";
import { getQueryClient, queryKeys } from "@/lib/query-common";

// Components that read the `[user]` query (EntryItem, the nav) would otherwise
// suspend on a live getSession() Storybook can't answer — seed a visitor.
const queryClient = getQueryClient();
queryClient.setQueryData(queryKeys.user, null);

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
  // The colour tokens use light-dark(), so flipping `color-scheme` on the root
  // (global.css reads data-theme) is the whole theme switch.
  globalTypes: {
    theme: {
      description: "Colour scheme",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
    (Story, context) => {
      const { theme } = context.globals;
      useEffect(() => {
        document.documentElement.dataset.theme = theme;
      }, [theme]);
      return <Story />;
    },
  ],
};

export default preview;
