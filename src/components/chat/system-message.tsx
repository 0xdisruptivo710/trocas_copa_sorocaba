interface Props {
  body: string;
}

export function SystemMessage({ body }: Props) {
  return (
    <div className="flex justify-center">
      <p className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
