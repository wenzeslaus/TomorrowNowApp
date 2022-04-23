/*
 * Filename: /home/coreywhite/Documents/GitHub/TomorrowNow/TomorrowNowApp/webapp/src/components/Grass/Modules/Inputs/ModuleBooleanParam.jsx
 * Path: /home/coreywhite/Documents/GitHub/TomorrowNow/TomorrowNowApp/webapp
 * Created Date: Friday, April 22nd 2022, 4:27:47 pm
 * Author: Corey White
 * 
 * Copyright (c) 2022 Corey White
 */


// react
import React, { useState, useEffect } from 'react';


import '../module.scss';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import Form from 'react-bootstrap/Form'


const ModuleBooleanParam = ({param}) => {
//   const [defaultValue, setDefaultValue] = useState([]);

  useEffect(() => {
      if (param.schema.type !== 'boolean') {
          console.warn(`GRASS module parameter ${param.name} is not boolean`, param)
      }
  }, [])
  
    return (      
        <Form.Group as={Row} className="mb-2" controlId="formHorizontalEmail">
            {/* <Form.Label column sm={2}>{param.name}</Form.Label> */}
            <Col sm={10}>
                <Form.Check 
                    id={param.name} 
                    inline={true} 
                    isValid={(param.default === 'True') ? true : false}
                    type="checkbox" 
                    label={param.name} />
                    <Form.Check.Label id={param.name} muted>{param.description}</Form.Check.Label>
            </Col>
            

        </Form.Group>                  
    )
}


export default ModuleBooleanParam





