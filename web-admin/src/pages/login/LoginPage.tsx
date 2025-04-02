import React, { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import { Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTranslate } from 'react-admin';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const notify = useNotify();
  const translate = useTranslate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    login({ username, password })
      .catch(error => {
        notify(
          typeof error === 'string'
            ? error
            : typeof error === 'undefined' || !error.message
            ? 'Invalid credentials'
            : error.message,
          { type: 'error' }
        );
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#16213e] border border-[#30475e] shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#3498db]/20 flex items-center justify-center mb-4">
              <LockOutlinedIcon className="text-[#3498db]" fontSize="large" />
            </div>
            <Typography variant="h5" className="text-[#e2e2e2] font-bold text-center">
              {translate('ra.auth.sign_in')}
            </Typography>
            <Typography variant="body2" className="text-[#b3b3b3] text-center mt-2">
              ECAR Garage Management System
            </Typography>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <TextField
                label={translate('ra.auth.username')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                fullWidth
                variant="outlined"
                required
                className="bg-[#141b2d]/20"
                InputLabelProps={{
                  className: "text-[#b3b3b3]"
                }}
                InputProps={{
                  className: "text-[#e2e2e2]"
                }}
              />
            </div>
            
            <div className="mb-6">
              <TextField
                label={translate('ra.auth.password')}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                variant="outlined"
                required
                className="bg-[#141b2d]/20"
                InputLabelProps={{
                  className: "text-[#b3b3b3]"
                }}
                InputProps={{
                  className: "text-[#e2e2e2]"
                }}
              />
            </div>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              className="py-3 bg-[#3498db] hover:bg-[#2980b9] text-white font-medium"
            >
              {loading ? (
                <CircularProgress size={24} className="text-white" />
              ) : (
                translate('ra.auth.sign_in')
              )}
            </Button>
          </form>
          
          <Box mt={4}>
            <Typography variant="caption" className="text-[#b3b3b3] text-center block">
              Version 1.0.0 - © 2025 ECAR Garage
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage; 