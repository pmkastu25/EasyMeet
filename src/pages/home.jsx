import React,{useContext, useState} from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "../App.css"
import IconButton from '@mui/material/IconButton';
import RestoreIcon from '@mui/icons-material/Restore'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { AuthContext } from '../contents/AuthContext';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVIdeoCall = async ()=> {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return ( 
        <>
        <div className="navBar">
            <div style={{display:"flex", alignItems: "center"}}><h2>EasyMeet</h2></div>

            <div  style={{display:"flex", alignItems: "center"}}>
                <IconButton onClick={
                    () => {
                        navigate("/history");
                    }
                }>
                    <RestoreIcon />
                </IconButton>
                <p>History</p>
                <Button onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/auth");
                }} >LogOut</Button>
            </div>
        </div>

        <div className="meetContainer">
            <div className="leftPanel">
                <div>
                    <h2 style={{marginBottom: "10px"}}>Providing Quality Video Call with EasyMeet as your Buddy</h2>
                     <TextField id="outlined-basic" label="Enter the Meeting Code" 
                                           onChange={(e)=> setMeetingCode(e.target.value)}
                                   variant="outlined" />
                    <Button style={{padding: "15px", marginLeft: "10px"}} onClick={handleJoinVIdeoCall} variant='contained'>Join</Button>
                </div>
            </div>
            <div className='RightPanel'>
                <img srcSet='../undraw_calling_ieh0.png' alt="" />
            </div>
        </div>
        </>
     );
}

export default withAuth(HomeComponent);