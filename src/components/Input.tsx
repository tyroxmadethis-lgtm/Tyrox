import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  name,
  type = "text",
  className = "",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={name}
          className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono block select-none"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={`w-full bg-neutral-900 border border-neutral-850 focus:border-cyan-500/50 p-2 text-cyan-400 rounded-lg text-xs font-mono transition-all outline-none ${className}`}
        {...props}
      />
    </div>
  );
};
