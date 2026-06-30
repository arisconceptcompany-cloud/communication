export function PostAvatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className="post-avatar"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}
