import { Paper } from "@mui/material";
import React, { ReactElement, useState } from 'react'
import { useSpring, animated } from '@react-spring/web'

const AnimatedPaper = animated(props => <Paper {...props}/>);

const AnimatedCircle = ( {children}: { children: ReactElement } ) => {
    const [active, toggle] = useState(false)
    const { x } = useSpring({
        from: { x: 0 },
        x: active ? 1 : 0,
        config: { duration: 100 },
      })
    
    return (
        <AnimatedPaper
            elevation={ x.to( x => Math.round(x * 3 + 2) ) }
            onMouseEnter={() => toggle(true)}
            onMouseLeave={() => toggle(false)}
            style={{
                scale: x.to({range: [0, 1], output: [1, 1.1] }),
                borderRadius: "50%",
                cursor: "pointer",

            }}
        >
            {children}
        </AnimatedPaper>
    );
}

export default AnimatedCircle;