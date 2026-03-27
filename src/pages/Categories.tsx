import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { Add, Category as CategoryIcon } from "@mui/icons-material";
import { supabase } from "../lib/supabase";
import { Category, Instance } from "../types/database";

const defaultColors = [
  "#1976d2",
  "#dc004e",
  "#9c27b0",
  "#f57c00",
  "#388e3c",
  "#00796b",
  "#c62828",
  "#5e35b1",
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(defaultColors[0]);
  const [instanceId, setInstanceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchInstances();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setCategories(data || []);
    }
  };

  const fetchInstances = async () => {
    const { data } = await supabase.from("instances").select("*").order("name");

    setInstances(data || []);
  };

  const handleOpen = () => {
    setName("");
    setType("expense");
    setColor(defaultColors[0]);
    setInstanceId(instances[0]?.id || "");
    setError("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("categories")
      .insert([{ name, type, color, instance_id: instanceId }]);

    if (error) {
      setError(error.message);
    } else {
      handleClose();
      fetchCategories();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) {
        setError(error.message);
      } else {
        fetchCategories();
      }
    }
  };

  const getCategoriesByInstance = () => {
    const grouped: { [key: string]: Category[] } = {};
    categories.forEach((category) => {
      if (!grouped[category.instance_id]) {
        grouped[category.instance_id] = [];
      }
      grouped[category.instance_id].push(category);
    });
    return grouped;
  };

  const groupedCategories = getCategoriesByInstance();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Categories</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          disabled={instances.length === 0}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {instances.length === 0 && (
        <Alert severity="info">
          Please create an instance first before adding categories.
        </Alert>
      )}

      <Grid container spacing={3}>
        {instances.map((instance) => (
          <Grid size={{ xs: 12 }} key={instance.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {instance.name}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {groupedCategories[instance.id]?.map((category) => (
                    <Chip
                      key={category.id}
                      icon={<CategoryIcon />}
                      label={category.name}
                      onDelete={() => handleDelete(category.id)}
                      sx={{
                        bgcolor: category.color,
                        color: "white",
                        "& .MuiChip-deleteIcon": { color: "white" },
                      }}
                    />
                  )) || (
                    <Typography variant="body2" color="text.secondary">
                      No categories yet
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
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
            label="Category Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value as "income" | "expense")}
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Color
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {defaultColors.map((c) => (
                <Box
                  key={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: c,
                    borderRadius: 1,
                    cursor: "pointer",
                    border: color === c ? "3px solid #000" : "1px solid #ccc",
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !name || !instanceId}
          >
            {loading ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
