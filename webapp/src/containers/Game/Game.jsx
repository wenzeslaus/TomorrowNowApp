// react
import React, { useState, useEffect } from 'react';
// import 'ol/ol.css';
import './game.scss';
// openlayers
// import XYZ from 'ol/source/XYZ';
import nlcdSource from '../../components/OpenLayers/Sources/nlcd';
import ned3DepSource from '../../components/OpenLayers/Sources/ned3dep';
import VectorSource from '../../components/OpenLayers/Sources/VectorSource';
// import nhdPlusSource from '../../components/OpenLayers/Sources/nhdPlus'
import survery from '../../components/OpenLayers/Sources/survey';
import Map from "../../components/OpenLayers/Map"
import Layers from "../../components/OpenLayers/Layers/Layers"
import TileLayer from "../../components/OpenLayers/Layers/TileLayer"
import VectorLayer from "../../components/OpenLayers/Layers/VectorLayer"
// import { fromLonLat } from 'ol/proj';
import osm from "../../components/OpenLayers/Sources/osm"
import Controls from "../../components/OpenLayers/Controls/Controls";
// import FullScreenControl from "../../components/OpenLayers/Controls/FullScreenControl";
// import ZoomSliderControl from "../../components/OpenLayers/Controls/ZoomSliderControl";
import { ScaleLineControl, ZoomSliderControl, FullScreenControl, RotateControl, EditMapControl } from "../../components/OpenLayers/Controls";
// import Reprojection from "../../components/OpenLayers/Views/Reprojection";
import surveyStyles from '../../components/OpenLayers/Features/surveyStyles';
// import {sourcesFromTileGrid} from 'ol/source';

import GeoTIFFSource from '../../components/OpenLayers/Sources/GeoTIFF'
// import Form from 'react-bootstrap/Form'
import Container from 'react-bootstrap/esm/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
// import GrassColors from '../../components/OpenLayers/Colors'
// import utils from "../../components/OpenLayers/Colors/utils";
import {TileDebug} from 'ol/source';
// import Container from 'react-bootstrap/esm/Container';
import Events from '../../components/OpenLayers/Events/Events';
import OnClick from '../../components/OpenLayers/Events/onClick';
import OnMapEvent from '../../components/OpenLayers/Events/onMapEvent';

import OnMoveEnd from '../../components/OpenLayers/Events/onMoveEnd';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import GrassColors from '../../components/OpenLayers/Colors'
import utils from "../../components/OpenLayers/Colors/utils";
import WebGLTileLayer from "../../components/OpenLayers/Layers/WebGLTileLayer"
import Reprojection from "../../components/OpenLayers/Views/Reprojection";
import ActiniaGeoTiff from '../../components/OpenLayers/Sources/ActiniaGeoTiff';

// import VectorSource from "ol/source/Vector";
// import { Style, Stroke } from "ol/style";
// import surveyStyles from "../Features/surveyStyles"

// Locally calculate Upstream Contributing Area
// https://openlayers.org/en/latest/examples/region-growing.html

const Game = ({params}) => {
    
    const [center, setCenter] = useState([-78.6802,35.8408]);
    const [zoom, setZoom] = useState(11);
    const [basinRaster, setBasinRaster] = useState(null);

    const [projection, setProjection] = useState('EPSG:4326')
    const [legend, setLegend] = useState(nlcdSource({LAYERS: "NLCD_01-19_Land_Cover_Change_First_Disturbance_Date"}).getLegendUrl())
    const [surveyData, setSurveyData] = useState([])
    const [extent, setExtent] = useState(null)
    const [source, setSource] = useState(null);
    const [view, setView] = useState(null)
    const [status, setStatus] = useState(null)
    const [resourceId, setResourceId] = useState(null)
    const [dataRangeMin, setDataRangeMin] = useState(null)
    const [dataRangeMax, setDataRangeMax] = useState(null)
    const [socketUrl, setSocketUrl] = useState(null);
    const [messageHistory, setMessageHistory] = useState(['test']);
    const { sendMessage, lastMessage, lastJsonMessage, readyState, getWebSocket } = useWebSocket(socketUrl, { share: false });
    const [tileColor, setTileColor] = useState(GrassColors.utils.autoDetectPalette())

    const connectionStatus = {
      [ReadyState.CONNECTING]: 'Connecting',
      [ReadyState.OPEN]: 'Open',
      [ReadyState.CLOSING]: 'Closing',
      [ReadyState.CLOSED]: 'Closed',
      [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];
    let _csrfToken = null;
    const API_HOST = "http://localhost:8005/savana"

    const [tileStyle, setTileStyle] = useState({
      // color: GrassColors.utils.autoDetectPalette(params.rasterId),
      color: undefined,
      exposure: ['var', 'exposure'],
      contrast: ['var', 'contrast'],
      saturation: ['var', 'saturation'],
      gamma: ['var', 'gamma'],
      // color: ['var', 'color'],
      variables: {
          exposure: 0,
          contrast: 0,
          saturation: 0,
          gamma: 1,
          color: undefined,
          level: 0
        }
    })

    async function getCsrfToken() {
      if (_csrfToken === null) {
          const response = await fetch(`${API_HOST}/csrf/`, {
          credentials: 'include',
          });
          const data = await response.json();
          _csrfToken = data.csrfToken;
      }
      return _csrfToken;
  }

    function onMoveEventHandler(e) {
      console.log("VectorLayer Click Event:", e)
      const view = e.target.getView()
      const _extent = view.calculateExtent()
      console.log('extent', _extent, 'resolution', view.getResolution())
      setExtent(extent)
      const viewResolution = (view.getResolution());
      const url = nlcdSource({LAYERS: 'NLCD_2019_Land_Cover_L48'}).getFeatureInfoUrl(
        _extent,
        viewResolution,
        'EPSG:4326',
        {'INFO_FORMAT': 'application/json'}
      );
      console.log(url)
      if (url) {
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            console.log("NLCD Data",data)
            // document.getElementById('info').innerHTML = html;
        });
      }
   
      e.target.getLayers().forEach((el) => {

        if (el.get('name') === "survey") {
          console.log(el.getSource().getFeatures().map(f=>f.getProperties()))
         let properties =  el.getSource().getFeatures().map(f=> {
            return f.getProperties()
          })


          var groupBy = function(data, key) { // `data` is an array of objects, `key` is the key (or property accessor) to group by
            // reduce runs this anonymous function on each element of `data` (the `item` parameter,
            // returning the `storage` parameter at the end
            return data.reduce(function(storage, item) {
              // get the first instance of the key by which we're grouping
              var group = item[key];
              
              // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
              storage[group] = storage[group] || []
              
              // add this item to its group within `storage`
              storage[group].push(item);
              
              // return the updated storage to the reduce function, which will then loop through the next 
              return storage; 
            }, {}); // {} is the initial value of the storage
          };

          let grouped = groupBy(properties,'how_serious_is_this_problem')


         console.log("Grouped", properties, )
       


         setSurveyData(Object.entries(grouped).map((k, v) => {
          console.log(k)
          let newData = {}
          newData.name = k[0]
          newData[k[0]] = k[1].length
          return newData
        }))

        }
      })

    }
  
    // const featureOverlayer = VectorLayer({
    //   source:VectorSource(), 
    //   style:surveyStyles.styleCache.selected
    // })
    let highlight;
    function surveyClickEvent(e) {
      console.log("VectorLayer Click Event:", e)
      const pixel = e.pixel
      const feature = e.target.forEachFeatureAtPixel(pixel, function (feature) {
        console.log(pixel, feature)
        console.log('Geometry', feature.getGeometry())
        return feature;
      });
      const view = e.target.getView()
      const extent = view.calculateExtent()
      console.log('extent', extent, 'resolution', view.getResolution())
      const viewResolution = (view.getResolution());
      const url = nlcdSource({LAYERS: 'NLCD_2019_Land_Cover_L48'}).getFeatureInfoUrl(
        extent,
        viewResolution,
        'EPSG:4326',
        {'INFO_FORMAT': 'application/json'}
      );
      console.log(url)
      if (url) {
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            console.log("NLCD Data",data)
            // document.getElementById('info').innerHTML = html;
        });
      }
     
      
      e.target.getLayers().forEach((el) => {
        if (el.get('name') === "survey") {
          console.log(el.getSource().getFeatures().map(f=>f.getProperties()))
          let properties =  el.getSource().getFeatures().map(f=> {
            return f.getProperties()
          })


          var groupBy = function(data, key) { // `data` is an array of objects, `key` is the key (or property accessor) to group by
            // reduce runs this anonymous function on each element of `data` (the `item` parameter,
            // returning the `storage` parameter at the end
            return data.reduce(function(storage, item) {
              // get the first instance of the key by which we're grouping
              var group = item[key];
              
              // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
              storage[group] = storage[group] || []
              
              // add this item to its group within `storage`
              storage[group].push(item);
              
              // return the updated storage to the reduce function, which will then loop through the next 
              return storage; 
            }, {}); // {} is the initial value of the storage
          };

          let grouped = groupBy(properties,'how_serious_is_this_problem')
  

         console.log("Grouped", properties, )
       


         setSurveyData(Object.entries(grouped).map((k, v) => {
          console.log(k)
          let newData = {}
          newData.name = k[0]
          newData[k[0]] = k[1].length
          return newData
        }))

        }
      })


    
      let isMounted = true;   
      async function rDrain(coords) {
            try {
               
                const csrftoken = document.cookie
                        .split('; ')
                        .find(row => row.startsWith('csrftoken='))
                        .split('=')[1];

                let geojson = [{
                  point: coords.join(','),
                  extent: extent
                }]

                let url = new URL(`${API_HOST}/r/drain/`)
                console.log(coords)
                const res = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify(geojson),
                    headers: {
                        // 'X-CSRFToken': await getCsrfToken()
                        'Content-Type': 'application/json'
                    }
                    // credentials: 'include'
                });
                const data = await res.json();
                console.log("response:", data)             
                setResourceId(data.response.resource_id)
                setStatus(data.response.status)
                // console.log("Starting Websocket...")
                // console.log("Websocket: ResourceId Received...")
                // console.log(`Websocket: Resource Id: ${data.response.resource_id}`)
                // let resourceName = data.response.resourceId.replace(/-/g , '_')
                // console.log(`Websocket: Resource Name: ${resourceName}`)

                // // setSocketUrl( `ws://localhost:8005/ws/savana/resource/${params.rasterId}/`)
                // setSocketUrl( `ws://localhost:8005/ws/savana/resource/${resourceName}/`)

              } catch (e) {
                console.log(e);
            }
            return () => { isMounted = false }

        }
        rDrain(e.coordinate)
      
    }

    // Get Websocket message history
    useEffect(() => {
      if (lastMessage !== null) {
        setMessageHistory((prev) => prev.concat(lastMessage));
      }
    }, [lastMessage, setMessageHistory]);

    // Open Websocket Connention for resource
    useEffect(()=> {
      if (!resourceId || !status) return;
      console.log("Starting Websocket...")
      console.log("Websocket: ResourceId Received...")
      console.log(`Websocket: Resource Id: ${resourceId}`)
      let resourceName = resourceId.replace(/-/g , '_')
      console.log(`Websocket: Resource Name: ${resourceName}`)

      // setSocketUrl( `ws://localhost:8005/ws/savana/resource/${params.rasterId}/`)
      setSocketUrl( `ws://localhost:8005/ws/savana/resource/${resourceName}/`)

  },[source, status, resourceId])

  // Send websocket status message to server
  useEffect(()=> {
      if (readyState != ReadyState.OPEN) return;
      console.log("Sending Websocket Message: ", status)
      sendMessage(JSON.stringify({message: status, resource_id: resourceId}))
      setMessageHistory([{message: status, resource_id: resourceId}])
  },[connectionStatus])

  // Log last message from Websocket
  useEffect(()=> {
      if (readyState != ReadyState.OPEN) return;
      console.log("Last Websocket Message", lastMessage)

  },[lastMessage])

  // Set source data once data is finished
  useEffect(() => {
      if (!lastJsonMessage) return;
      if (lastJsonMessage.message !== 'finished') return;

      console.log("Last Message: ", lastJsonMessage)
      if (lastJsonMessage) {
          let data = lastJsonMessage

          setBasinRaster("point_basin")
         
      
        
            // const rastersData = `${API_HOST}/r/resource/point_basin/stream/${data.resource_id}`
            // setDataRangeMin(data.statistics.min)
            // setDataRangeMax(data.statistics.max)

            // let sourceOptions = {
            //     sources: [{url: rastersData}], 
            //     allowFullFile: true, 
            //     forceXHR: true, 
            //     normalize: false, // set true for imagery
            //     convertToRGB: false,
            //     interpolate: true, // set fault for discrete data
            //     style: tileStyle
            // }
            // console.log("COG Url: ", rastersData)
            // let tmpSource = GeoTIFFSource(sourceOptions)
            // setSource(tmpSource)
       

          

         
      }
  }, [lastJsonMessage]);


    useEffect(() => {
      // 'https://storage.googleapis.com/download/storage/v1/b/tomorrownow-actinia-dev/o/dem_10m_mosaic_cog.tif?alt=media'
         console.log(this)

         
      }, [])
  
        return (
          <Container>
              
            <Row>
              <Col md={8}>
            <Map mapClass="map-fullscreen" center={center} zoom={zoom} projection='EPSG:4326'>
             
              <Layers>
                  <TileLayer source={ned3DepSource({layer: 'Hillshade Multidirectional'})} opacity={1} ></TileLayer>
                  {/* <TileLayer source={nlcdSource()} opacity={0.5}></TileLayer> */}
                  <TileLayer source={nlcdSource({LAYERS: 'mrlc_display:NLCD_01-19_Land_Cover_Change_First_Disturbance_Date'})} opacity={0.5}></TileLayer>

                  {/* <TileLayer source={nlcdDataSouce}></TileLayer> */}
                  <TileLayer source={osm()} opacity={0.5}></TileLayer>
                  <TileLayer zIndex={5} source={new TileDebug()}></TileLayer>

                  {/* <WebGLTileLayer 
                            // gamma={gammaValue}
                            // opacity={opacity}
                            // saturation={saturationValue}
                            // contrast={contrastValue}
                            // exposure={exposureValue}
                            layerName="point_basin"
                            style={tileStyle}
                            color={tileColor}
                            // minZoom={0}
                            // maxZoom={16}
                            source={source}>
                        </WebGLTileLayer> */}
                  {
                    basinRaster ? 
                      <ActiniaGeoTiff 
                        rasterName={basinRaster} 
                        mapsetName="basin_test"
                        opacity={0.75}
                      ></ActiniaGeoTiff> : null
                  }
                  
                  <VectorLayer layerName="featureOverlayer" source={VectorSource()} style={surveyStyles.styleCache.selected}></VectorLayer>
                  <VectorLayer layerName="survey" source={survery()}  style={surveyStyles.setSurveyStyle} ></VectorLayer> 
                   

              </Layers>

              <Events>
                <OnMapEvent eventName='click' eventHandler={surveyClickEvent}></OnMapEvent>
                <OnMapEvent eventName='moveend' eventHandler={onMoveEventHandler}></OnMapEvent>
                {/* <OnClick eventHandler={surveyClickEvent} /> */}
                {/* <OnMoveEnd eventHandler={onMoveEventHandler}></OnMoveEnd> */}
              </Events>

              <Controls>
                  <FullScreenControl />
                  <ZoomSliderControl />
                  <ScaleLineControl />
                  {/* <RotateControl autoHide={false}/> */}
                  <EditMapControl />
              </Controls>
              {/* <Reprojection epsg='3358'></Reprojection>  */}
              {/* <Reprojection epsg='4326'></Reprojection>  */}

              </Map>
              </Col>
             
             <Col md={1}></Col>
             
             <Col md={3}>
             <h2>Survey Data</h2>
             <h3>Stormwater Problem Severity</h3>
                <BarChart
                  width={400}
                  height={400}
                  data={surveyData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 10,
                  }}
                >
                 

           

            <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="unserious" fill={surveyStyles.colorScheme[0]} />
                  <Bar dataKey="somewhat_unserious" fill={surveyStyles.colorScheme[1]} />
                  <Bar dataKey="neutral" fill={surveyStyles.colorScheme[2]} />
                  <Bar dataKey="somewhat_serious" fill={surveyStyles.colorScheme[3]} />
                  <Bar dataKey="serious" fill={surveyStyles.colorScheme[4]} />
                </BarChart>
                </Col>
                </Row>
                <Row>
                  <Col md={10}>
                  </Col>
                  <Col md={2}>
                  
                  <Card style={{ width: '18rem' }}>
                    
                    <Card.Body>
                      <Card.Title>NLCD 01-19 Land Cover Change First Disturbance Date</Card.Title>
                      <Card.Text>
                     {status}
                     {resourceId}
                  
                    <span>{messageHistory[-1]}</span>
                
                      </Card.Text>
                    </Card.Body>
                    <Card.Img variant="top" src={legend} />
                  </Card>

                  
                  </Col>
                </Row>
          </Container>
        )
  }


export default Game