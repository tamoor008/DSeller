import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppImages } from '../../../constants/AppImages';
import { AppStrings } from '../../../constants/AppStrings';
import FontFamilty from '../../../constants/FontFamilty';
import InfoModal from '../../components/InfoModal';
import TextComp from '../../components/TextComp';
import { AppColors } from '../../../constants/AppColors';
import { useSelector } from 'react-redux';
import { getBaseUrl } from '../../../utils/api/baseUrl';



const IncomeTab = ({ }) => {
  const BASE_URL = getBaseUrl(); // instant access, no async

  const [isVisible, setIsvisible] = useState(false)
  const selector = useSelector(state => state.AppReducer);
  const [loader, setLoader] = useState(false)

  const onInfoPress = () => {
    setIsvisible(true)
  }
  const [all_access_tokens, setAll_access_tokens] = useState([]);

  const [income, setIncome] = useState([
  ]);

  const [tabs, setTabs] = useState([
    {
      title: AppStrings.lastweek,
      selected: true,
    },
    {
      title: AppStrings.weekinprogress,
      selected: false,
    },

  ])

  const [total, setTotal] = useState(0)

  const toggleTabs = (index) => {
    setTabs(prevTabs =>
      prevTabs.map((tab, i) => ({
        ...tab,
        selected: i === index
      }))
    );
  };

  const getDarazIncome = async (access_token, storeName, createdAfterISO) => {

    try {
      const response = await fetch(`${BASE_URL}/get-daraz-income-details?access_token=${access_token}&created_after=${encodeURIComponent(createdAfterISO)}&storeName=${storeName}`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      // console.log(data);
      setIncome(prev => [...prev, ...data.financeRespone])




    } catch (error) {
      return null;
    }
  };

  useEffect(() => {

    setLoader(true)
    if (!all_access_tokens || (Array.isArray(all_access_tokens) && all_access_tokens.length === 0)) return;

    const fetchOrders = async () => {
      setIncome([])


      const createdAfter = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      let requests = [];

      if (Array.isArray(all_access_tokens)) {
        // Filter out invalid access tokens before making requests
        const validTokens = all_access_tokens.filter(item =>
          item && item.access_token && item.access_token.trim() !== ''
        );
        requests = validTokens.flatMap(item => [
          getDarazIncome(item.access_token, item.name, createdAfter),
        ]);
      } else if (all_access_tokens && all_access_tokens.access_token && all_access_tokens.access_token.trim() !== '') {
        requests = [
          getDarazIncome(all_access_tokens.access_token, all_access_tokens.name, createdAfter),
        ];
      } else {
      }

      try {
        await Promise.all(requests); // Wait for all async tasks to complete
      } catch (error) {
      } finally {
        setLoader(false);
        // allOrder.map((item,index)=>console.log(item.sku))

      }
    };

    fetchOrders();
  }, [all_access_tokens]);

  useEffect(() => {
    let newTokens = [];

    if (selector.selectedStore?.id) {
      const access_token = selector.selectedStore.user?.token?.access_token;
      const name = selector.selectedStore?.user.seller.data.name;

      // Only include if access_token exists and is not empty
      if (access_token && access_token.trim() !== '') {
        newTokens = [{
          access_token: access_token,
          name: name || null
        }];
      }
    } else {
      // Filter out stores without valid access tokens
      newTokens = Array.isArray(selector.access_tokens)
        ? selector.access_tokens.filter((token: any) =>
          token && token.access_token && token.access_token.trim() !== ''
        )
        : [];
    }


    // Only update state if value has changed
    const hasChanged = JSON.stringify(newTokens) !== JSON.stringify(all_access_tokens);
    if (hasChanged) {
      setAll_access_tokens(newTokens);
    }

  }, [selector]);

  useEffect(() => {
    // console.log(income);
    const totalIncome = income.reduce((sum, item) => {
      return sum + parseFloat(item.payout.replace(' PKR', '') || 0);
    }, 0);
    setTotal(totalIncome)

  }, [income]);


  return (

    <View style={{ rowGap: 16, flex: 1 }}>

      <View style={styles.container}>
        {tabs.map((item, index) => (
          <TouchableOpacity onPress={() => { toggleTabs(index) }} activeOpacity={0.9} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: item.selected ? AppColors.primaryOrange : AppColors.black25, borderRadius: 16, paddingVertical: 4, flexDirection: 'row', columnGap: 4 }} key={index}>
            <TextComp size={12} style={{ fontFamily: FontFamilty.medium, color: item.selected ? AppColors.white : AppColors.black50, textAlign: 'center', }}>{item.title}</TextComp>

          </TouchableOpacity>
        ))}


      </View>

      {tabs[0].selected && (
        loader ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator color={AppColors.primaryOrange} size={'large'} />
          </View>
        ) : (
          <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>
            <View style={{ paddingVertical: 8, paddingHorizontal: 16, rowGap: 16 }}>
              {income?.map((item, index) => (
                <View key={index} style={{ rowGap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black, textAlign: 'left' }}>
                        {item?.storeName}
                      </TextComp>
                      <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'left' }}>
                        {item?.statement_number}
                      </TextComp>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                      <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.black80, textAlign: 'right' }}>
                        {'Rs '}
                      </TextComp>
                      <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.black, textAlign: 'right' }}>
                        {item?.payout}
                      </TextComp>
                    </View>
                  </View>


                  {index < income.length - 1 && (
                    <View style={{ height: 1, backgroundColor: AppColors.black25 }} />
                  )}
                </View>
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                paddingVertical: 8,
                backgroundColor: AppColors.primaryOrange,
                borderBottomEndRadius: 4,
                borderBottomLeftRadius: 4,
              }}
            >
              <TextComp numberOfLines={1} size={16} style={{ fontFamily: FontFamilty.regular, color: AppColors.white, flex: 2 }}>
                {AppStrings.total}
              </TextComp>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                <TextComp size={12} style={{ fontFamily: FontFamilty.regular, color: AppColors.white80, textAlign: 'right' }}>
                  {'Rs '}
                </TextComp>
                <TextComp size={16} style={{ fontFamily: FontFamilty.semibold, color: AppColors.white, textAlign: 'right' }}>
                  {total}
                </TextComp>
              </View>
            </View>
          </View>
        )
      )}



      {tabs[1].selected && (

        <View style={{ backgroundColor: AppColors.white, elevation: 10, borderRadius: 4 }}>


          <View style={{ paddingVertical: 8, paddingHorizontal: 16, rowGap: 16 }}>
            <TextComp size={16} style={{ fontFamily: FontFamilty.medium, color: AppColors.black, textAlign: 'left' }}>{'You have to check this data through your seller center'}</TextComp>
          </View>


        </View>
      )}

    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    columnGap: 8
  },

});

export default IncomeTab;
