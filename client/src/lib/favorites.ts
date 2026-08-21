export function addFavoriteId(ids: string[], gigId: string) { return ids.includes(gigId) ? ids : [...ids, gigId]; }
export function removeFavoriteId(ids: string[], gigId: string) { return ids.filter(id => id !== gigId); }
export function removeFavoriteItem<T extends { id: string }>(items: T[], gigId: string) { return items.filter(item => item.id !== gigId); }
