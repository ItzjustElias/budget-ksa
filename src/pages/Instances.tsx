import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Instance } from '../types/database';

export default function Instances() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [open, setOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    const { data, error } = await supabase
      .from('instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setInstances(data || []);
    }
  };

  const handleOpen = (instance?: Instance) => {
    if (instance) {
      setEditingInstance(instance);
      setName(instance.name);
      setDescription(instance.description);
    } else {
      setEditingInstance(null);
      setName('');
      setDescription('');
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingInstance(null);
    setName('');
    setDescription('');
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (editingInstance) {
      const { error } = await supabase
        .from('instances')
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq('id', editingInstance.id);

      if (error) {
        setError(error.message);
      } else {
        handleClose();
        fetchInstances();
      }
    } else {
      const { error } = await supabase
        .from('instances')
        .insert([{ name, description }]);

      if (error) {
        setError(error.message);
      } else {
        handleClose();
        fetchInstances();
      }
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this instance? This will also delete all associated data.')) {
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', id);

      if (error) {
        setError(error.message);
      } else {
        fetchInstances();
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Instances</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Create Instance
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {instances.map((instance) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={instance.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{instance.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {instance.description || 'No description'}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                  Created: {new Date(instance.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton size="small" onClick={() => handleOpen(instance)}>
                  <Edit />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(instance.id)}>
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingInstance ? 'Edit Instance' : 'Create New Instance'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !name}>
            {loading ? 'Saving...' : editingInstance ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
