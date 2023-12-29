import { Box, ButtonBase, Tooltip, useTheme } from "@mui/material";
import { AppConfig, isMainnet, isTestnet } from "../../model/AppConfig";
import AnimatedItem from "../base/AnimatedItem";

const KarlsenLogo = ({ appConfig }: {appConfig: AppConfig | null}) => {
    const theme = useTheme();
    let logoColor = theme.palette.brand.logo.main;
    let logoBkgColor = theme.palette.background.paper;

    if (appConfig) {
        if (isMainnet(appConfig)) {
            // Do nothing
        } else if (isTestnet(appConfig)) {
            logoColor = theme.palette.background.paper;
            logoBkgColor = theme.palette.brand.logo.main;
        } else {
            logoColor = theme.palette.primary.light;
        }

    }

    return (
        <AnimatedItem borderRadius={"50px"} magnify={1.03} backgroundColor={theme.palette.primary.main}>
            <Tooltip
                title={
                    <Box sx={{
                        fontWeight: 'normal',
                        fontSize: '1.2em'
                    }}>
                        <strong>Karlsen Graph Inspector (KGI)</strong><br/>
                        <br/>
                        KGI: v{appConfig ? appConfig.webVersion : "n/a"}<br/>
                        Karlsend: v{appConfig ? appConfig.karlsendVersion : "n/a"}<br/>
                        <br/>
                        Network: <strong>{appConfig ? appConfig.network : "n/a"}</strong>
                    </Box>
                }
                placement="left"
                arrow
                enterDelay={theme.transitions.duration.enteringScreen*1.5}
            >
                <ButtonBase color="primary" sx={{borderRadius: '50%'}} focusRipple>
                    <Box sx={{
                        borderRadius: '50%',
                        borderStyle: 'solid',
                        borderColor: logoBkgColor,
                        borderWidth: '6px',
                        height: '92px',
                        backgroundColor: logoBkgColor
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
                            <g>
                                <path d="M 37.047395,78.587748 C 36.804726,78.55189 35.651979,78.385753 34.485712,78.21859 26.404227,77.06032 18.341119,72.999116 12.693081,67.242146 6.5549374,60.985613 2.8497578,53.407665 1.7443276,44.849417 1.3937716,42.135423 1.5059544,36.577068 1.9627325,34.028661 3.3793122,26.12528 7.1077649,18.913402 12.704158,13.251715 19.395799,6.4820037 28.361238,2.365054 37.916006,1.6743826 c 2.482828,-0.1794673 4.359031,-0.098768 7.307075,0.314359 10.886241,1.5255177 21.057763,7.980856 27.111588,17.2063214 4.217697,6.427377 6.258814,13.28785 6.258814,21.036727 0,12.683582 -6.127501,24.502896 -16.307545,31.455571 -5.059385,3.455416 -10.694906,5.679895 -16.782258,6.624372 -1.479312,0.229515 -7.452276,0.424481 -8.456285,0.276015 z M 31.73804,70.653782 c 0.992631,-0.277988 1.481635,-0.687427 2.344318,-1.962883 0.176841,-0.261466 0.239202,-0.259815 1.794727,0.04775 2.022195,0.399826 5.130264,0.53751 6.979408,0.309174 1.362096,-0.168201 4.022395,-0.668986 4.466121,-0.840728 0.151524,-0.05865 0.31334,0.09389 0.512015,0.482808 0.664349,1.300454 1.796109,1.979765 3.289592,1.974498 2.425498,-0.0085 3.885335,-1.923168 3.447114,-4.520987 l -0.100088,-0.593345 1.16356,-0.76973 c 1.163143,-0.769454 1.163658,-0.769622 1.435613,-0.466308 0.748223,0.8345 2.589099,1.249616 3.618221,0.815908 1.463475,-0.616762 2.315866,-1.866832 2.315866,-3.396327 0,-0.476111 -0.09838,-1.103121 -0.21859,-1.393358 l -0.218589,-0.527707 0.930391,-1.358817 c 1.289566,-1.883396 2.304742,-3.714447 3.388937,-6.112569 0.911877,-2.016971 0.93279,-2.047469 1.525153,-2.223884 2.038731,-0.607162 3.105676,-2.536258 2.510659,-4.539402 -0.216691,-0.729541 -1.024838,-1.687101 -1.730114,-2.050015 l -0.545596,-0.280748 0.13237,-1.160409 c 0.18419,-1.614657 0.02724,-4.8167 -0.343573,-7.014919 -0.240522,-1.425437 -0.270353,-1.863468 -0.130003,-1.910648 0.437655,-0.147121 1.391381,-1.196138 1.706245,-1.876687 0.60432,-1.306166 0.37371,-2.619651 -0.670551,-3.819272 -0.660842,-0.75916 -1.537349,-1.148984 -2.596201,-1.154662 l -0.872728,-0.0046 -0.879949,-1.489332 c -0.483998,-0.819177 -1.289655,-2.01195 -1.790377,-2.650649 l -0.910394,-1.161273 0.3132,-0.638504 c 0.426575,-0.869634 0.425871,-2.348023 -0.0015,-3.173591 -0.693552,-1.339712 -1.706074,-1.919912 -3.359089,-1.924835 -1.051417,-0.0031 -1.256386,0.04294 -1.798404,0.404391 -0.336456,0.224347 -0.666201,0.407924 -0.732768,0.407924 -0.06657,0 -0.779414,-0.438066 -1.584108,-0.973476 -0.804696,-0.535411 -2.273783,-1.373578 -3.264638,-1.862592 -1.610037,-0.794598 -1.801556,-0.929761 -1.801556,-1.271437 0,-1.800772 -1.760201,-3.454733 -3.676646,-3.454733 -1.411685,0 -2.61315,0.7469857 -3.217649,2.000509 l -0.278412,0.57732 -2.627174,0.03067 c -2.296971,0.02694 -4.594929,0.261688 -5.724246,0.585066 -0.243853,0.06984 -0.391157,-0.05661 -0.75648,-0.649378 C 33.214994,10.141778 32.284958,9.5642022 31.186172,9.4498191 30.109331,9.3377153 29.496026,9.4734864 28.710541,9.9983985 27.481578,10.819462 26.941729,12.410299 27.30115,14.151644 l 0.107168,0.519174 -1.261929,0.815844 c -0.694064,0.448717 -1.345235,0.876397 -1.44705,0.9504 -0.123502,0.08978 -0.352382,0.006 -0.687736,-0.252135 -1.647825,-1.267712 -3.631916,-1.291156 -4.962458,-0.05863 -0.919769,0.852004 -1.291325,2.628989 -0.827164,3.955926 0.246955,0.705976 0.272408,0.637128 -0.697653,1.886855 -1.092043,1.406886 -2.920769,4.444137 -3.722525,6.182584 -0.712522,1.544965 -0.725674,1.561615 -1.311198,1.65988 -2.9208657,0.490196 -4.0531718,4.141767 -1.903931,6.139984 0.358169,0.332997 0.813078,0.67984 1.010915,0.770756 0.308846,0.141919 0.345195,0.230616 0.257098,0.627126 -0.135402,0.609413 -0.132326,5.074185 0.0037,5.6901 0.102453,0.463211 0.07862,0.495779 -0.626409,0.856133 -1.6874801,0.862499 -2.3536433,3.05982 -1.4607568,4.81828 0.5020688,0.98877 1.7846938,1.928369 2.6323798,1.928369 0.228037,0 0.506532,0.421932 1.248362,1.891283 1.16419,2.305933 2.268565,4.097416 3.702778,6.006546 l 1.085703,1.445215 -0.21306,0.921213 c -0.324673,1.403778 -0.0037,2.548066 0.975536,3.477297 0.951307,0.902772 2.067293,1.209111 3.374584,0.926326 0.581764,-0.125848 0.940588,-0.328091 1.472562,-0.829987 l 0.703367,-0.6636 1.29371,0.934254 c 0.711542,0.513837 1.314604,0.947197 1.340143,0.963015 0.02559,0.01569 -0.02907,0.311578 -0.121335,0.657237 -0.242421,0.908072 -0.05612,1.953205 0.493845,2.770569 0.94937,1.410926 2.387472,1.95757 3.97806,1.512122 z m 5.382888,-3.255995 C 35.52819,67.16585 34.607396,66.914433 34.484848,66.678044 34.41698,66.547159 34.316867,66.230328 34.262351,65.973976 34.1517,65.453653 34.415085,65.095964 37.326162,61.813387 l 1.455282,-1.641001 0.720938,0.377266 c 0.964968,0.50497 2.179769,0.51646 3.208746,0.03035 l 0.734343,-0.346916 0.330542,0.295695 c 0.673023,0.602056 3.871245,3.519682 4.18849,3.821007 l 0.328364,0.311884 -0.487213,0.962101 -0.487212,0.962099 -1.348019,0.323687 c -0.741413,0.178026 -1.927339,0.395352 -2.6354,0.482944 -1.454581,0.179924 -4.994101,0.182951 -6.214087,0.0052 z m -10.044727,-3.815725 -1.147246,-0.850388 8.84e-4,-18.690336 c 5.5e-4,-10.279682 0.0038,-20.462074 0.0075,-22.62754 l 0.0066,-3.937209 1.184811,-0.772457 c 0.651676,-0.424854 1.245695,-0.772461 1.320067,-0.772461 0.07436,0 0.351906,0.133254 0.616742,0.296119 0.26485,0.162865 0.589432,0.296366 0.721328,0.296672 0.198445,4.45e-4 0.269006,0.301278 0.409072,1.743503 0.0931,0.958621 0.231194,2.214888 0.30686,2.791702 0.07568,0.576816 0.181465,1.678346 0.235101,2.447848 l 0.09753,1.39909 -0.543604,0.198279 c -2.948407,1.075365 -2.971184,5.418359 -0.03481,6.636609 l 0.686086,0.284644 5.51e-4,7.961551 5.53e-4,7.961558 -0.503118,0.167485 c -1.999723,0.665669 -3.040005,3.106376 -2.131137,5.000058 0.356952,0.743739 1.286473,1.598914 1.993857,1.834386 0.597158,0.198775 0.58411,-0.09412 0.194372,4.362155 -0.361627,4.134747 -0.397911,4.382548 -0.641717,4.382548 -0.105619,0 -0.503198,0.16688 -0.883512,0.370837 -0.380315,0.203976 -0.704525,0.369697 -0.720467,0.368303 -0.01596,-0.0014 -0.545244,-0.38522 -1.17623,-0.852937 z m 5.235185,0.361425 c -0.339993,-0.176979 -0.621107,-0.421924 -0.624696,-0.544301 -0.0096,-0.332378 0.721166,-8.203026 0.764408,-8.231276 0.02064,-0.01321 0.26529,-0.116105 0.544001,-0.228303 0.27871,-0.112201 0.723946,-0.396309 0.989413,-0.631405 l 0.482663,-0.427445 0.481249,0.339693 c 0.264684,0.186831 0.962153,0.701998 1.54993,1.144815 l 1.068683,0.805123 -0.08521,0.68476 c -0.05251,0.421949 -0.0021,0.956372 0.131131,1.392466 l 0.216361,0.707708 -0.905991,0.998158 c -0.498295,0.548983 -1.556927,1.749103 -2.35252,2.666932 -0.795593,0.91783 -1.490348,1.663401 -1.543898,1.656824 -0.05355,-0.0066 -0.375543,-0.156781 -0.715532,-0.333757 z M 52.573228,63.823281 C 51.727181,63.373923 51.139343,63.30993 50.093271,63.553312 l -0.631245,0.146846 -1.133547,-1.094054 c -0.623451,-0.601726 -1.777681,-1.677215 -2.564952,-2.389965 -1.17058,-1.059776 -1.4066,-1.342665 -1.295266,-1.55249 0.07488,-0.141121 0.179567,-0.586888 0.232679,-0.990595 0.405336,-3.08196 -3.073324,-5.157818 -5.679223,-3.389028 l -0.749971,0.509066 -0.832775,-0.639705 c -0.458025,-0.351848 -1.147128,-0.855099 -1.531339,-1.11835 l -0.69856,-0.478631 -0.0014,-0.994143 c -0.0011,-0.834823 -0.07307,-1.120246 -0.448759,-1.781015 -0.427722,-0.752284 -1.524582,-1.66067 -2.005237,-1.66067 -0.204058,0 -0.205243,-0.05664 -0.231827,-11.041421 l -0.01211,-5.03381 0.468931,-0.159257 c 0.732363,-0.248696 1.385886,-0.856684 1.854626,-1.72535 0.345808,-0.640855 0.428431,-0.972876 0.421696,-1.694664 l -0.0083,-0.897651 0.900414,-0.613108 c 0.495225,-0.33721 1.339118,-0.925857 1.87532,-1.308107 l 0.974909,-0.695 0.569282,0.377613 c 1.198083,0.794704 2.831558,0.800391 4.009756,0.01376 0.871148,-0.581479 1.633296,-1.815787 1.633296,-2.645149 0,-0.305699 0.213829,-0.394109 2.536883,-1.04877 1.395286,-0.393212 3.687309,-1.041875 5.093389,-1.441471 1.406074,-0.399596 2.582047,-0.700775 2.613266,-0.669282 0.05919,0.05971 -2.658979,2.632945 -7.079411,6.7019 -0.886321,0.815849 -2.440639,2.256289 -3.45404,3.200978 -1.013397,0.94469 -3.166134,2.944626 -4.78386,4.444298 -4.635541,4.297267 -7.349141,6.860245 -7.401871,6.991018 -0.05991,0.148579 -0.06811,0.140598 2.181038,2.125157 1.011075,0.892143 2.566295,2.296564 3.456044,3.12094 1.564731,1.449761 3.783982,3.449437 13.05209,11.760698 5.203752,4.666514 5.04414,4.391905 3.274164,5.633029 -0.605575,0.424633 -1.151558,0.762643 -1.213293,0.751132 -0.06173,-0.01156 -0.471559,-0.211765 -0.910714,-0.445008 z m -33.8928,-6.10639 c -1.21691,-1.659722 -2.312694,-3.404624 -3.41148,-5.432375 -0.942572,-1.739458 -0.982915,-1.852646 -0.713765,-2.002532 0.368381,-0.20516 1.562544,-1.409197 1.765298,-1.779911 0.153726,-0.281081 0.191177,-0.279881 2.169219,0.06956 l 2.012791,0.355589 v 4.710457 4.710457 l -0.433895,0.226296 c -0.238643,0.124472 -0.469798,0.226294 -0.513679,0.226294 -0.04388,0 -0.4374,-0.487749 -0.874489,-1.083881 z m 41.971025,0.675785 c -0.363988,-0.123234 -0.737111,-0.2654 -0.82917,-0.315911 -0.135865,-0.07455 -7.736869,-6.877155 -9.980165,-8.931858 -0.323545,-0.296341 -2.441294,-2.191125 -4.706104,-4.210625 -2.264815,-2.0195 -4.202746,-3.752038 -4.306512,-3.850083 -0.192721,-0.182071 1.941443,-2.270489 8.80018,-8.611543 1.411016,-1.304518 3.128015,-2.908938 3.815546,-3.565372 3.409417,-3.255213 7.004384,-6.53198 7.463322,-6.802719 0.110799,-0.06537 0.331562,0.0568 0.55694,0.308221 0.473149,0.527811 3.009674,4.337941 3.009674,4.520857 0,0.07519 -0.165834,0.30398 -0.368526,0.508421 -1.047296,1.056341 -1.331792,2.76086 -0.683959,4.097811 l 0.339404,0.700441 -1.905185,3.452882 -1.905189,3.452885 -0.954402,-0.04951 c -1.607823,-0.08338 -3.009134,0.757561 -3.58706,2.152677 -0.116932,0.282336 -0.310235,0.492879 -0.452469,0.492879 -0.136552,0 -2.071427,-0.297739 -4.2997,-0.661644 -5.045059,-0.823916 -5.959584,-0.922673 -6.254926,-0.675447 -0.3072,0.257145 -0.285504,0.996397 0.03429,1.168417 0.233836,0.125793 6.061828,1.10391 8.934245,1.499454 1.769635,0.243687 1.740255,0.230147 2.024133,0.932697 0.29058,0.71914 1.107028,1.635533 1.78914,2.008159 0.306889,0.16765 0.805145,0.246714 1.554632,0.246714 1.248765,0 1.794358,-0.219249 2.683477,-1.078443 l 0.551022,-0.532472 0.957987,0.511732 0.957987,0.511727 -0.08787,0.603894 c -0.183419,1.260367 0.549921,2.771245 1.664956,3.430341 0.795504,0.470221 0.800483,0.43816 -0.478368,3.081241 -1.161371,2.400277 -3.315204,5.893216 -3.60201,5.84149 -0.04045,-0.0075 -0.37134,-0.114098 -0.735329,-0.237331 z M 18.517102,47.003246 c -0.889748,-0.187222 -1.667359,-0.346175 -1.728023,-0.353218 -0.06066,-0.0071 -0.110313,-0.083 -0.110313,-0.168779 0,-0.150643 3.451937,-1.918298 3.750178,-1.920383 0.09106,-6.68e-4 0.129224,0.535747 0.100213,1.408497 -0.0323,0.9714 -0.100869,1.404047 -0.22059,1.391901 -0.09555,-0.01 -0.901715,-0.170814 -1.791464,-0.358029 z m -3.088361,-2.591044 c -0.232463,-0.244729 -0.755176,-0.570092 -1.161572,-0.723001 -0.582552,-0.219175 -0.76393,-0.368283 -0.857187,-0.704618 -0.151621,-0.546796 -0.189857,-4.535514 -0.05121,-5.344254 0.09431,-0.55027 0.157719,-0.625771 0.595011,-0.708515 0.269188,-0.05094 0.738412,-0.263033 1.042705,-0.471311 l 0.553259,-0.378694 0.674825,0.38837 c 0.371152,0.213609 1.487243,0.8026 2.480199,1.308888 l 1.805374,0.92052 -0.04058,2.042175 -0.04059,2.042175 -2.188271,1.036624 c -1.203546,0.570146 -2.233493,1.036628 -2.288769,1.036628 -0.05529,0 -0.290706,-0.200234 -0.523178,-0.444987 z m 47.980597,-0.724154 c -0.987934,-0.534364 -0.992293,-0.539521 -0.992692,-1.173062 -4.44e-4,-0.660568 -0.41013,-1.651999 -0.910708,-2.203753 l -0.28885,-0.318378 1.511478,-2.722509 c 0.831313,-1.497382 1.680195,-3.039539 1.886406,-3.427016 0.265511,-0.498915 0.439298,-0.677469 0.595519,-0.611848 0.121334,0.05097 0.471397,0.142581 0.777925,0.203592 0.306532,0.06098 0.580714,0.136084 0.609295,0.166825 0.02857,0.03074 0.163413,0.690062 0.299606,1.465117 0.285794,1.626313 0.459976,5.576793 0.308707,7.001542 l -0.103391,0.973863 -0.560192,0.09035 c -0.308105,0.04971 -0.897691,0.324515 -1.310185,0.610713 -0.412496,0.286199 -0.768133,0.511567 -0.790306,0.500823 -0.02202,-0.01074 -0.486844,-0.261052 -1.032604,-0.556262 z M 18.44357,35.881353 c -1.091963,-0.571921 -1.970416,-1.105931 -1.952119,-1.186687 0.01835,-0.08074 0.07556,-0.431176 0.127226,-0.778713 0.07159,-0.481576 0.168619,-0.649187 0.407929,-0.704623 0.172694,-0.04001 1.004571,-0.238376 1.848623,-0.440825 0.844052,-0.202435 1.557255,-0.34527 1.584897,-0.31739 0.02763,0.02788 0.03195,1.044608 0.0094,2.259395 l -0.04071,2.208701 z m -2.658004,-4.830367 c -0.358036,-0.379984 -0.768512,-0.753534 -0.912167,-0.83011 -0.24331,-0.129714 -0.231034,-0.206329 0.179658,-1.119905 0.676144,-1.504083 1.980798,-3.722843 3.273507,-5.567081 0.643347,-0.917828 1.200863,-1.668779 1.238929,-1.668779 0.03808,0 0.264465,0.101841 0.503102,0.226305 l 0.433894,0.226306 v 4.220941 4.220936 l -0.330898,0.07568 c -0.182005,0.04161 -1.096834,0.262649 -2.032977,0.491126 l -1.702077,0.415454 z m 18.467032,-5.18141 c -0.146707,-0.16349 -0.618518,-0.47088 -1.048483,-0.68306 -0.914027,-0.451054 -0.79255,0.0087 -1.230025,-4.656429 -0.172136,-1.835656 -0.3362,-3.456176 -0.364587,-3.601155 -0.03713,-0.189591 0.148689,-0.365973 0.661839,-0.628254 l 0.713457,-0.364657 2.722349,2.222881 2.722347,2.222885 -0.218618,0.527764 c -0.239091,0.57722 -0.300053,1.528087 -0.1439,2.245208 0.09604,0.441022 0.05107,0.493378 -1.195226,1.392326 -0.712255,0.51374 -1.482084,1.088355 -1.710727,1.276924 -0.506773,0.417942 -0.571405,0.421186 -0.908424,0.04558 z m 10.231949,-5.896204 -0.638917,-0.83288 0.864017,-1.661337 0.864018,-1.661333 1.052451,-0.06813 c 1.437954,-0.09308 2.364241,-0.653088 3.066869,-1.854149 0.01074,-0.01853 0.792476,0.362488 1.73704,0.846584 1.924299,0.986216 4.146119,2.409954 4.270321,2.736414 0.104081,0.273597 -0.342174,0.414999 -8.726012,2.764895 -0.930191,0.260732 -1.727171,0.494012 -1.771065,0.518426 -0.04389,0.0245 -0.367316,-0.330409 -0.718722,-0.788497 z m -6.000423,-1.511863 c -0.846413,-0.676233 -3.873282,-3.16431 -4.360519,-3.58433 -0.237881,-0.205049 0.246027,-1.490709 0.614309,-1.632108 0.671325,-0.257741 3.962545,-0.576789 5.950195,-0.576789 h 2.031771 l 0.274399,0.645693 c 0.150918,0.355135 0.490325,0.893738 0.754225,1.1969 l 0.479817,0.551201 -0.898632,1.732738 -0.898631,1.732739 -0.907038,0.104104 c -0.498869,0.05726 -1.154882,0.227803 -1.457803,0.378966 l -0.550771,0.27485 z" style={{fill:logoColor}}/>
                            </g>
                        </svg>
                    </Box>
                </ButtonBase>
            </Tooltip>
        </AnimatedItem>
    );
}

export default KarlsenLogo;
