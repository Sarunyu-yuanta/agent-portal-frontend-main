import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The app's type scale (`globals.css`) and system-one's `text-xxs` are font
// sizes. Without this, tailwind-merge reads an unknown `text-*` as a colour and
// `cn("text-meta", "text-gray-500")` would silently drop the size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "xxs",
            "micro",
            "meta",
            "label",
            "body-sm",
            "body",
            "body-lg",
            "title-sm",
            "title",
            "title-lg",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
