import { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Person, Instance } from '../types/database';

export default function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPeople();
    fetchInstances();
  }, []);

  const fetchPeople = async () => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setPeople(data || []);
    }
  };

  const fetchInstances = async () => {
    const { data } = await supabase
      .from('instances')
      .select('*')
      .order('name');

    setInstances(data || []);
  };

  const handleOpen = (person?: Person) => {
    if (person) {
      setEditingPerson(person);
      setName(person.name);
      setEmail(person.email);
      setPhone(person.phone);
      setRole(person.role);
      setInstanceId(person.instance_id);
    } else {
      setEditingPerson(null);
      setName('');
      setEmail('');
      setPhone('');
      setRole('');
      setInstanceId(instances[0]?.id || '');
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPerson(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (editingPerson) {
      const { error } = await supabase
        .from('people')
        .update({ name, email, phone, role, instance_id: instanceId })
        .eq('id', editingPerson.id);

      if (error) {
        setError(error.message);
      } else {
        handleClose();
        fetchPeople();
      }
    } else {
      const { error } = await supabase
        .from('people')
        .insert([{ name, email, phone, role, instance_id: instanceId }]);

      if (error) {
        setError(error.message);
      } else {
        handleClose();
        fetchPeople();
      }
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) {
        setError(error.message);
      } else {
        fetchPeople();
      }
    }
  };

  const getInstanceName = (instanceId: string) => {
    return instances.find((i) => i.id === instanceId)?.name || 'Unknown';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">People</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          disabled={instances.length === 0}
        >
          Add Person
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {instances.length === 0 && (
        <Alert severity="info">
          Please create an instance first before adding people.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Instance</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.id}>
                <TableCell>{person.name}</TableCell>
                <TableCell>{person.email}</TableCell>
                <TableCell>{person.phone}</TableCell>
                <TableCell>{person.role}</TableCell>
                <TableCell>{getInstanceName(person.instance_id)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(person)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(person.id)}>
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
          {editingPerson ? 'Edit Person' : 'Add New Person'}
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
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Phone"
            type="tel"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Role"
            type="text"
            fullWidth
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !name || !instanceId}>
            {loading ? 'Saving...' : editingPerson ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
