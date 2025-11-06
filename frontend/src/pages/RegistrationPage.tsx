import { useEffect } from 'react';
import RegistrationPageTitle from '../components/RegistrationPageTitle';
//import LoggedInName from '../components/LoggedInName';
import RegistrationUI from '../components/RegistrationUI';

const RegistrationPage = () =>
    {

        useEffect(() => 
        {
            document.title = 'FormaTrack Registration';
        }, []); // empty array means "run this only once"

        return(
            <div>
            <RegistrationPageTitle />
            {/* <LoggedInName /> */}
            <RegistrationUI />
            </div>
        );
        
    }
    
export default RegistrationPage;