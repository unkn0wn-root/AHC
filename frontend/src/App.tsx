import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar, Button, IconButton, Toolbar, Typography
} from '@mui/material';
import { Routes, Route, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import React, {
  createContext, useEffect, useMemo, useState
} from 'react';
import ConfessionDetails from './pages/ConfessionDetails';
import Confessions from './pages/Confessions';
import Conversations from './pages/Conversations';
import Index from './pages/Index';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Permissions from './pages/Permissions';
import Replies from './pages/Replies';
import createAPIClient from './service/ApiClient';
import { HttpClient } from './service/HttpClient';
import theme from './theme';


const defaultHTTPClient = new HttpClient();
export const APIContext = createContext<{
  httpClient: HttpClient,
  apiClient: ReturnType<typeof createAPIClient>
}>({
  httpClient: defaultHTTPClient,
  apiClient: createAPIClient(defaultHTTPClient),
});

function App() {
  const [user, setUser] = useState<any>(undefined);
  const { enqueueSnackbar } = useSnackbar();
  const httpClient = useMemo(() => new HttpClient([
    (err) => {
      enqueueSnackbar(err.message);
      return err;
    },
  ]), [enqueueSnackbar]);
  const apiClient = createAPIClient(httpClient);

  const hasPermission = (permission: string) => !!user?.permissions[permission];

  useEffect(() => {
    httpClient.SWALLOW(httpClient.GET('/users/me'))
      .then((res) => {
        setUser(res);
      });
  }, [httpClient]);

  return (
    <>
      <AppBar position="static" color="default" sx={{
        backgroundColor: '#4385f0',
        marginBottom: 2
      }}>
        <Toolbar>
          <IconButton sx={{ marginRight: theme.spacing(2) }} edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Anonimowe Hejto Wyznania
          </Typography>
          {hasPermission('addEntry') && hasPermission('deleteEntry') && (
          <Button color="inherit">
            <Link to="/confessions" color="inherit">Wyznania</Link>
          </Button>
          )}
          {hasPermission('addReply') && hasPermission('deleteReply') && (
          <Button color="inherit">
            <Link to="/replies" color="inherit">Odpowiedzi</Link>
          </Button>
          )}
          {hasPermission('accessModsList') && (
            <Button color="inherit">
              <Link to="/permissions" color="inherit">Dostęp</Link>
            </Button>
          )}
          {hasPermission('accessMessages') && (
            <Button color="inherit">
              <Link to="/conversations" color="inherit">Rozmowy</Link>
            </Button>
          )}
          {user ? (
            <>
              <IconButton
                color="inherit"
              >
                <AccountCircleIcon />
              </IconButton>
              <Button color="inherit">
                <Link to="/logout" color="inherit">Wyloguj</Link>
              </Button>
            </>
          ) : (
            <Button color="inherit">
              <Link to="/login" color="inherit">Logowanie</Link>
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <APIContext.Provider value={{ httpClient, apiClient }}>
        <Routes>
          <Route path="/confessions" element={<Confessions />}></Route>
          <Route path="/confessions/:id" element={<ConfessionDetails />}></Route>
          <Route path="/replies" element={<Replies />}></Route>
          <Route path="/permissions" element={<Permissions />}></Route>
          <Route path="/conversations" element={<Conversations />}></Route>
          <Route path="/login" element={<Login setUser={setUser} />}></Route>
          <Route path="/logout" element={<Logout setUser={setUser} />}></Route>
          <Route path="*" element={<Index />}></Route>
        </Routes>
      </APIContext.Provider>
    </>
  );
}

export default App;
