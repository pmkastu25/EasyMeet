import React, { useEffect,useState, useRef } from 'react';
import io from "socket.io-client";
import "../styles/videoComponent.css"
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
const server_url = "http://localhost:8000";

var connections  = {};

const peerConfigConnections = {
    "iceServer": [
        {"urls" : "stun:stun.l.google.com:19302"}
    ]
}

function VideoMeetComponent() {
    // let connections = useRef({})
    // connections.current

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("")

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // //todo
    // if(isChrome() === false){
    // }
    const getPermissions = async () => {
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});

            if(videoPermission) {
                setVideoAvailable(true);
            }else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});

            if(audioPermission) {
                setAudioAvailable(true);
            }else {
                setAudioAvailable(false);
            }

            if(navigator.mediaDevices.getDisplayMedia){
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false)
            }

            if(videoAvailable || audioAvailable){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable})

                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream  //stream defined under srcObject of video tag
                    }
                }
            }
         } catch(err) {
            console.log(err);
        }
    }

    let getUsermediaSuccess = (stream) => {

    }

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable)){
            //connect audio,video state
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then (getUsermediaSuccess) //TODO: getUsermediaSuccess. mute audio or close video in all other computers connected through stream, send only audio or video stream
            .then((stream)=>{})
            .catch((e)=>console.log(e))

        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch(e) {}
        }
    }

    useEffect(() =>{
        getPermissions();
    },[])

    useEffect(() => {
        if(video !== undefined && audio !== undefined){
            getUserMedia();
        }
    }, [audio, video])

    //TODO
    let gotMessageFromServer = (fromId, message) => {
        
    }

    //TODO: addMessage
    let addMessage = () => {

    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, {secure: false});

        socketRef.current.on('signal', gotMessageFromServer) //connected to emmited signal from server

        socketRef.current.on("connect", ()=>{
            socketRef.current.emit("join-call", window.location.href);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage)

            socketRef.current.on("user-left", (id)=> {
                //TODO
                setVideo((videos)=>videos.filter((video)=>video.socketId !== id)) //get all videos exce
                // pt the id that has left
            })

            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connections[socketListId].onicecandidate = (event) => {
                        //icecandidate  is a protocol (interactive connectivity establishment) makes a direct connection between the clients
                        //send connection to signalling server to all clients
                        if(event.candidate !== null){
                            socketRef.current.emit("signal", socketListId, JSON.stringify({'ice': event.candidate}));
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find((video) => video.socketId === socketListId)

                        if(videoExists) {
                            setVideo(videos => {
                                const updatedVideos = videos.map(video => 
                                    video.socketId === socketListId ? {...video, stream: event.stream} : video
                                );
                            //socketListID will loop infinitely but video.socketId gets current id\
                            videoRef.current = updatedVideos; //instantaneously update videos
                            return updatedVideos;
                            });
                        } else {
                            //Create new video
                            console.log("CREATING NEW")

                            let newVideo = {
                                socketId: socketListId, 
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }

                            setVideos(videos => {
                                const updatedVideos = {...videos, newVideo}
                                videoRef.current = updatedVideos;
                                return updatedVideos
                            });
                        }
                    };

                    if(window.localStream !== undefined && window.localStream !== null){
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        //TODO: blacksilence
                        //blacksilence: video off ---> blackcoloured screen
                        // let blackSilence
                    }
                })
                if(id === socketIdRef.current){
                    for(let id2 in connections){
                        if(id2 === socketIdRef.current) continue

                        try{
                            connections[id2].addStream(window.localStream)
                        } catch(e) {
                            connections[id2].createOffer().then((description) => {
                                connections[id2].setLocalDescription(description)
                                .then(()=>{
                                    socketRef.current.emit("signal", id2, JSON.stringify({"sdp":connections[id2].localDescription}))
                                })
                                .catch(e => console.log(e))
                            })
                        }
                    }
                }
            })
    })
    }

    let getMedia = () => {
        setVideo(videoAvailable); //Async
        setAudio(audioAvailable); //Async
        connectToSocketServer();
    }

    let connect = () =>{
        setAskForUsername(false);
        getMedia();
    }
    return ( 
        <div>
            {askForUsername === true ? 
            <div>
                <h2>Enter into Lobby</h2>
                <TextField id="outlined-basic" label="Username" 
                value={username}
                onChange = {(e) => {setUsername(e.target.value)}}
                variant="outlined" />
                <Button variant="contained" onClick={connect}>Connect</Button>

                <div>
                    <video ref={localVideoRef} autoPlay muted ></video> 
                </div>

            </div>: <></>}
        </div> 
     );
}

export default VideoMeetComponent;