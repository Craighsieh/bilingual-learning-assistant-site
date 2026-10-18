export const PUBLIC_FORM_IDS = ['prac01', 'mock01', 'mock02'] as const;

export function isPublicFormId(id: string): boolean {
  return PUBLIC_FORM_IDS.some((offered) => offered === id);
}
