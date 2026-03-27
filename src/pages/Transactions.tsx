import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Menu,
} from '@mui/material';
import { Add, Edit, Delete, Download, Upload, MoreVert } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Transaction, Category, Person, Instance } from '../types/database';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [personId, setPersonId] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchPeople();
    fetchInstances();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setTransactions(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const fetchPeople = async () => {
    const { data } = await supabase.from('people').select('*');
    setPeople(data || []);
  };

  const fetchInstances = async () => {
    const { data } = await supabase.from('instances').select('*').order('name');
    setInstances(data || []);
  };

  const handleOpen = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setDate(transaction.date);
      setCategoryId(transaction.category_id || '');
      setPersonId(transaction.person_id || '');
      setInstanceId(transaction.instance_id);
    } else {
      setEditingTransaction(null);
      setType('expense');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setPersonId('');
      setInstanceId(instances[0]?.id || '');
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const transactionData = {
      type,
      amount: parseFloat(amount),
      description,
      date,
      category_id: categoryId || null,
      person_id: personId || null,
      instance_id: instanceId,
    };

    if (editingTransaction) {
      const { error } = await supabase
        .from('transactions')
        .update({ ...transactionData, updated_at: new Date().toISOString() })
        .eq('id', editingTransaction.id);

      if (error) {
        setError(error.message);
      } else {
        handleClose();
        fetchTransactions();
      }
    } else {
      const { error } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (error) {
        setError(error.message);
      } else {
        handleClose();
        fetchTransactions();
      }
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        setError(error.message);
      } else {
        fetchTransactions();
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Description', 'Category', 'Person', 'Instance'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      t.amount,
      t.description,
      getCategoryName(t.category_id),
      getPersonName(t.person_id),
      getInstanceName(t.instance_id),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setAnchorEl(null);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      const data = lines.slice(1);

      const importedTransactions = [];

      for (const line of data) {
        const columns = line.split(',').map((col) => col.replace(/^"|"$/g, '').trim());

        if (columns.length >= 4) {
          const [dateStr, typeStr, amountStr, desc] = columns;

          importedTransactions.push({
            date: dateStr,
            type: typeStr.toLowerCase() === 'income' ? 'income' : 'expense',
            amount: parseFloat(amountStr),
            description: desc,
            instance_id: instanceId || instances[0]?.id,
            imported_from_csv: true,
          });
        }
      }

      if (importedTransactions.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .insert(importedTransactions);

        if (error) {
          setError(error.message);
        } else {
          fetchTransactions();
          setAnchorEl(null);
        }
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const getPersonName = (personId: string | null) => {
    return people.find((p) => p.id === personId)?.name || '-';
  };

  const getInstanceName = (instanceId: string) => {
    return instances.find((i) => i.id === instanceId)?.name || 'Unknown';
  };

  const filteredCategories = categories.filter(
    (c) => c.instance_id === instanceId && c.type === type
  );

  const filteredPeople = people.filter((p) => p.instance_id === instanceId);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Transactions</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<MoreVert />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ mr: 1 }}
          >
            CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            disabled={instances.length === 0}
          >
            Add Transaction
          </Button>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleExportCSV}>
          <Download sx={{ mr: 1 }} /> Export CSV
        </MenuItem>
        <MenuItem onClick={() => fileInputRef.current?.click()}>
          <Upload sx={{ mr: 1 }} /> Import CSV
        </MenuItem>
      </Menu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleImportCSV}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {instances.length === 0 && (
        <Alert severity="info">
          Please create an instance first before adding transactions.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Instance</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Person</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>{getInstanceName(transaction.instance_id)}</TableCell>
                <TableCell>
                  <Chip
                    label={transaction.type}
                    color={transaction.type === 'income' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>€{transaction.amount.toFixed(2)}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{getCategoryName(transaction.category_id)}</TableCell>
                <TableCell>{getPersonName(transaction.person_id)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(transaction)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(transaction.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel>Instance</InputLabel>
            <Select
              value={instanceId}
              label="Instance"
              onChange={(e) => setInstanceId(e.target.value)}
            >
              {instances.map((instance) => (
                <MenuItem key={instance.id} value={instance.id}>
                  {instance.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value as 'income' | 'expense')}
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            inputProps={{ step: '0.01', min: '0' }}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {filteredCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Person</InputLabel>
            <Select
              value={personId}
              label="Person"
              onChange={(e) => setPersonId(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {filteredPeople.map((person) => (
                <MenuItem key={person.id} value={person.id}>
                  {person.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !amount || !instanceId}>
            {loading ? 'Saving...' : editingTransaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
