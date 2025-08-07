import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contents/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home"

function History() {
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);

  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();

        setMeetings(history);
      } catch {
        //Implement Snackbar
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      {meetings.map((e) => {
        return (
          <>
          <IconButton onClick={() => {
            routeTo("/home");
          }}>
            <HomeIcon />
          </IconButton>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  gutterBottom
                  sx={{ color: "text.secondary", fontSize: 14 }}
                >
                  Word of the Day
                </Typography>
                <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
                  adjective
                </Typography>
                <Typography variant="body2">
                  well meaning and kindly.
                  <br />
                  {'"a benevolent smile"'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Learn More</Button>
              </CardActions>
            </Card>
          </>
        );
      })}
    </div>
  );
}

export default History;
