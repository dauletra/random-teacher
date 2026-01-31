// List of admin email addresses
// Add your email here to get admin access
export const ADMIN_EMAILS: string[] = [
  // 'your-email@gmail.com',
    'daulet.rakhmankul@gmail.com',
    'tarazdaryn522@gmail.com'
];

export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
