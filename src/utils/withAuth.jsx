import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

const withAuth = (WrappedComp) => {
    const AuthComp = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if(localStorage.getItem("token")){
                return true;
            }
            return false;
        }
    

    useEffect(() => {
        if(!isAuthenticated){
            router("/auth");
        }
    }, [])
    return <WrappedComp {...props} />
}

return AuthComp;

}

export default withAuth;