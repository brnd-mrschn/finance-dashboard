import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FiChevronDown } from "react-icons/fi";

interface Option {
  value: string;
  label: string;
}

interface DropdownFilterProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export function DropdownFilter({ label, value, options, onChange, className = "" }: DropdownFilterProps) {
  const selected = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={`flex flex-col items-center justify-center h-full ${className}`}>
      <span className="mb-0 text-xs font-semibold text-[var(--foreground)] leading-none">{label}</span>
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <div className="relative w-28">
            <Listbox.Button className="flex w-full h-9 items-center justify-between rounded border-none bg-transparent px-2 text-[var(--foreground)] outline-none transition-all focus:ring-2 focus:ring-[var(--primary)] shadow-sm border border-[var(--surface-alt)]">
              <span className="truncate text-left text-sm">{selected?.label}</span>
              <FiChevronDown className="ml-2 text-lg" />
            </Listbox.Button>
            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[var(--surface)] py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-2 px-4 text-sm ${
                        active ? "bg-[var(--surface-alt)]" : ""
                      } ${selected ? "font-semibold text-[var(--primary)]" : "text-[var(--foreground)]"}`
                    }
                  >
                    {option.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  );
}
