const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { authState } = useContext(AuthContext);

  return authState.token ? <Component {...rest} /> : <Navigate to="/login" />;
};
