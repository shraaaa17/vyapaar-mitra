/** "sharma.ji@paytm" → "sh•••@paytm": enough for the merchant to recognise, not enough to copy. */
export function maskVpa(vpa: string) {
  const [local, domain] = vpa.split('@')
  return `${local.slice(0, 2)}•••@${domain ?? ''}`
}

/** "04:7B:22:E1" → "••:••:22:E1". */
export function maskUid(uid: string) {
  const parts = uid.split(':')
  return parts.map((part, i) => (i < parts.length - 2 ? '••' : part)).join(':')
}
