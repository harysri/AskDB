export function getInitials(user) {
  const name = user?.fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() || "?";
  }
  const email = user?.email || "";
  return (email[0] || "?").toUpperCase();
}

export function getDisplayName(user) {
  return user?.fullName?.trim() || user?.email || "User";
}

export function getFirstName(user) {
  const name = getDisplayName(user);
  return name.split(/\s+/)[0];
}

export function getRoleLabel(role) {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
