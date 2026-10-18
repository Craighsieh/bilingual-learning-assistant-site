export const PUBLIC_FORM_IDS = ['prac01', 'mock01', 'mock02'];
export function isPublicFormId(id) {
    return PUBLIC_FORM_IDS.some((offered) => offered === id);
}
