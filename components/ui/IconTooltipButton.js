// components/ui/IconTooltipButton.js
import * as Tooltip from '@radix-ui/react-tooltip';

export default function IconTooltipButton({ icon: Icon, label, onClick, className }) {
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onClick}
            className={`p-2 rounded hover:bg-gray-200 transition ${className}`}
          >
            <Icon size={18} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className="bg-black text-white text-xs px-2 py-1 rounded shadow-md z-50"
          >
            {label}
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
