import { Button, UIButtonProps } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/utils";
import { forwardRef, LegacyRef, useState } from "react";

export interface TypeInputProps {
  className?: string;
  multiline?: boolean;

  // Button props
  buttonProps?: UIButtonProps | null;

  //Input props
  inputProps?: React.ComponentProps<"input">;

  //Textarea props
  textAreaProps?: React.ComponentProps<"textarea">;

  // Label prop
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> | null;

  //Info props
  infoClassname?: string;
  infoText?: string;
}

export const TypeInput: React.FC<TypeInputProps> = forwardRef((props, ref) => {
  const {
    inputProps,
    textAreaProps,
    multiline,
    className,
    labelProps,
    infoText,
    infoClassname,
    buttonProps,
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("grid w-full gap-1.5 font-mono", className)}>
      {labelProps && <Label {...labelProps}>{labelProps.children}</Label>}

      <div
        className={cn(
          "w-full justify-between flex p-3 items-center bg-black rounded-[0.5rem]",
          {
            "border-primary border-[0.2px]": isFocused,
          },
        )}
      >
        {multiline ? (
          <Textarea
            {...{
              ...textAreaProps,
              onFocus: (...args) => {
                setIsFocused(true);
                textAreaProps?.onFocus?.(...args);
              },
              onBlur: (...args) => {
                setIsFocused(false);
                textAreaProps?.onBlur?.(...args);
              },
            }}
            ref={(textAreaProps?.ref || ref) as LegacyRef<HTMLTextAreaElement>}
            className={cn(
              `border-primary rounded-xl resize-none border-none outline-0 focus-visible:ring-0`,
              inputProps?.className,
            )}
            style={{
              maxHeight: 40 * (textAreaProps?.rows || 1),
            }}
          />
        ) : (
          <Input
            {...{
              ...inputProps,
              onFocus: (...args) => {
                setIsFocused(true);
                inputProps?.onFocus?.(...args);
              },
              onBlur: (...args) => {
                setIsFocused(false);
                inputProps?.onBlur?.(...args);
              },
            }}
            ref={(inputProps?.ref || ref) as LegacyRef<HTMLInputElement>}
            className={cn(
              "border-primary rounded-[0.5rem] border-none outline-0 focus-visible:ring-0",
              className,
            )}
          />
        )}

        {buttonProps && (
          <Button
            {...buttonProps}
            className="text-primary disabled:opacity-0 bg-primary/15 text-[12px]"
            variant="ghost"
          >
            {buttonProps.children}
          </Button>
        )}
      </div>

      {infoText && (
        <p className={cn("text-sm text-red-500 py-2", infoClassname)}>
          {infoText}
        </p>
      )}
    </div>
  );
});
