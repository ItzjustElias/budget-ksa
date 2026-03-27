import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Business,
  People,
  Category,
  AccountBalance,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types/database';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    instances: 0,
    people: 0,
    categories: 0,
    transactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const [
      { count: instanceCount },
      { count: peopleCount },
      { count: categoryCount },
      { data: transactions },
    ] = await Promise.all([
      supabase.from('instances').select('*', { count: 'exact', head: true }),
      supabase.from('people').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const totalIncome = (transactions || [])
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalExpense = (transactions || [])
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    setSummary({
      instances: instanceCount || 0,
      people: peopleCount || 0,
      categories: categoryCount || 0,
      transactions: (transactions || []).length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });

    setRecentTransactions(transactions || []);
  };

  const summaryCards = [
    {
      title: 'Instances',
      value: summary.instances,
      icon: <Business sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.light',
    },
    {
      title: 'People',
      value: summary.people,
      icon: <People sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.light',
    },
    {
      title: 'Categories',
      value: summary.categories,
      icon: <Category sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary.light',
    },
    {
      title: 'Transactions',
      value: summary.transactions,
      icon: <AccountBalance sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.light',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {summaryCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography variant="h3">{card.value}</Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Total Income</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                €{summary.totalIncome.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">Total Expense</Typography>
              </Box>
              <Typography variant="h3" color="error.main">
                €{summary.totalExpense.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Balance</Typography>
              </Box>
              <Typography
                variant="h3"
                color={summary.balance >= 0 ? 'success.main' : 'error.main'}
              >
                €{summary.balance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type}
                            color={transaction.type === 'income' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell align="right">
                          €{parseFloat(transaction.amount.toString()).toFixed(2)}
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
