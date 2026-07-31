// Preview stub: haptics are fire-and-forget no-ops in a browser preview.
export enum ImpactFeedbackStyle { Light = 'light', Medium = 'medium', Heavy = 'heavy', Rigid = 'rigid', Soft = 'soft' }
export enum NotificationFeedbackType { Success = 'success', Warning = 'warning', Error = 'error' }
export async function impactAsync(_style?: ImpactFeedbackStyle): Promise<void> {}
export async function notificationAsync(_type?: NotificationFeedbackType): Promise<void> {}
export async function selectionAsync(): Promise<void> {}
