export interface Instance {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  instance_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  created_at: string;
}

export interface Person {
  id: string;
  instance_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  instance_id: string;
  category_id: string | null;
  person_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  imported_from_csv: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithDetails extends Transaction {
  category?: Category;
  person?: Person;
}
