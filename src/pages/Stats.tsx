import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  People as PeopleIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Transaction, Instance } from '../types/database';

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  peopleCount: number;
  categoryCount: number;
  categoryBreakdown: { name: string; amount: number; color: string }[];
  monthlyData: { month: string; income: number; expense: number }[];
}

export default function Stats() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('all');
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    peopleCount: 0,
    categoryCount: 0,
    categoryBreakdown: [],
    monthlyData: [],
  });

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    if (instances.length > 0) {
      fetchStats();
    }
  }, [selectedInstance, instances]);

  const fetchInstances = async () => {
    const { data } = await supabase
      .from('instances')
      .select('*')
      .order('name');

    setInstances(data || []);
  };

  const fetchStats = async () => {
    let transactionsQuery = supabase.from('transactions').select('*');
    let categoriesQuery = supabase.from('categories').select('*');
    let peopleQuery = supabase.from('people').select('id, instance_id');

    if (selectedInstance !== 'all') {
      transactionsQuery = transactionsQuery.eq('instance_id', selectedInstance);
      categoriesQuery = categoriesQuery.eq('instance_id', selectedInstance);
      peopleQuery = peopleQuery.eq('instance_id', selectedInstance);
    }

    const [
      { data: transactions },
      { data: categories },
      { data: people },
    ] = await Promise.all([
      transactionsQuery,
      categoriesQuery,
      peopleQuery,
    ]);

    const totalIncome = (transactions || [])
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalExpense = (transactions || [])
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const categoryBreakdown: { [key: string]: { name: string; amount: number; color: string } } = {};

    (transactions || []).forEach((t) => {
      if (t.category_id) {
        const category = (categories || []).find((c) => c.id === t.category_id);
        if (category) {
          if (!categoryBreakdown[category.id]) {
            categoryBreakdown[category.id] = {
              name: category.name,
              amount: 0,
              color: category.color,
            };
          }
          categoryBreakdown[category.id].amount += parseFloat(t.amount.toString());
        }
      }
    });

    const monthlyData = getMonthlyData(transactions || []);

    setStats({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: (transactions || []).length,
      peopleCount: (people || []).length,
      categoryCount: (categories || []).length,
      categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
      monthlyData,
    });
  };

  const getMonthlyData = (transactions: Transaction[]) => {
    const monthlyMap: { [key: string]: { income: number; expense: number } } = {};

    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyMap[month]) {
        monthlyMap[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyMap[month].income += parseFloat(t.amount.toString());
      } else {
        monthlyMap[month].expense += parseFloat(t.amount.toString());
      }
    });

    return Object.entries(monthlyMap)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Statistics</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Instance</InputLabel>
          <Select
            value={selectedInstance}
            label="Instance"
            onChange={(e) => setSelectedInstance(e.target.value)}
          >
            <MenuItem value="all">All Instances</MenuItem>
            {instances.map((instance) => (
              <MenuItem key={instance.id} value={instance.id}>
                {instance.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Total Income</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                €{stats.totalIncome.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">Total Expense</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                €{stats.totalExpense.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Balance</Typography>
              </Box>
              <Typography
                variant="h4"
                color={stats.balance >= 0 ? 'success.main' : 'error.main'}
              >
                €{stats.balance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">People</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {stats.peopleCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              {stats.categoryBreakdown.length > 0 ? (
                <Box>
                  {stats.categoryBreakdown.map((category) => (
                    <Box key={category.name} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{category.name}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          €{category.amount.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          bgcolor: 'grey.200',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(category.amount / stats.totalExpense) * 100}%`,
                            height: '100%',
                            bgcolor: category.color,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No category data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Overview
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Income</TableCell>
                      <TableCell align="right">Expense</TableCell>
                      <TableCell align="right">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.monthlyData.map((data) => (
                      <TableRow key={data.month}>
                        <TableCell>{data.month}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`€${data.income.toFixed(2)}`}
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`€${data.expense.toFixed(2)}`}
                            size="small"
                            color="error"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`€${(data.income - data.expense).toFixed(2)}`}
                            size="small"
                            color={data.income - data.expense >= 0 ? 'success' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
