import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking
} from 'react-native';
import { COLORS } from '../styles/theme';
import { CompanyInfo } from '../types/cms';

interface AboutScreenProps {
  companyInfo: CompanyInfo;
  isDark: boolean;
}

export default function AboutScreen({ companyInfo, isDark }: AboutScreenProps) {
  const [subSection, setSubSection] = useState<'story' | 'quality' | 'factory'>('story');
  const theme = isDark ? COLORS.dark : COLORS.light;

  const steps = [
    { num: '01', title: 'Source Aquifers Sourcing', desc: 'Sourced from deep natural underground channels.' },
    { num: '02', title: 'Sand Filtration', desc: 'Eliminates suspended dirt and fine silt particles.' },
    { num: '03', title: 'Activated Carbon Filter', desc: 'Neutralizes chlorine content, cancellation of bad taste/odor.' },
    { num: '04', title: 'Micron Cartridge', desc: 'Pre-filtration screening micro residues down to 5 microns.' },
    { num: '05', title: 'Reverse Osmosis (RO)', desc: 'Blocks 98%+ dissolved solids, mineral toxins, and heavy metals.' },
    { num: '06', title: 'Mineral configuration', desc: 'Balances taste by adding Magnesium and Potassium.' },
    { num: '07', title: 'Polishing Filter', desc: 'Final polishing filter that adds high clarity sparkle.' },
    { num: '08', title: 'UV Treatment', desc: 'Disinfects biological elements via ultraviolet chambers.' },
    { num: '09', title: 'Ozonation', desc: 'Active oxygen ozonation barrier provides continuous packaging protection.' },
    { num: '10', title: 'Hourly Quality Audit', desc: 'Strict lab tests performed on chemistry and microbiology hourly.' }
  ];

  const handleOpenMap = (type: 'office' | 'plant') => {
    const query = type === 'office' 
      ? companyInfo.OfficeAddress || ''
      : companyInfo.PlantAddress || '';
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch((err) => console.error("Error opening maps:", err));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Sub Menu */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.tabButton, subSection === 'story' ? styles.activeTabButton : null]}
          onPress={() => setSubSection('story')}
        >
          <Text style={[styles.tabText, { color: subSection === 'story' ? COLORS.primary : theme.textMuted }]}>
            Our Story
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, subSection === 'quality' ? styles.activeTabButton : null]}
          onPress={() => setSubSection('quality')}
        >
          <Text style={[styles.tabText, { color: subSection === 'quality' ? COLORS.primary : theme.textMuted }]}>
            10-Step Pure
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, subSection === 'factory' ? styles.activeTabButton : null]}
          onPress={() => setSubSection('factory')}
        >
          <Text style={[styles.tabText, { color: subSection === 'factory' ? COLORS.primary : theme.textMuted }]}>
            Our Plant
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* OUR STORY */}
        {subSection === 'story' && (
          <View style={styles.animateContainer}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>The NIMRA Philosophy</Text>
              <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
                {companyInfo.AboutStory}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.textMuted, marginTop: 10 }]}>
                NIMRA water is bottled in highly hygienic conditions. Under T.S. Enterprises, we focus on continuous quality improvements, strict batching, and providing local drinking water solutions.
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.statNum}>100%</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Touch Free</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.statNum}>IS 14543</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>ISI Standard</Text>
              </View>
            </View>
          </View>
        )}

        {/* 10-STEP PURIFICATION */}
        {subSection === 'quality' && (
          <View style={styles.animateContainer}>
            <Text style={[styles.timelineIntro, { color: theme.text }]}>
              {companyInfo.QualityText || "Quality is our philosophy. Sourced responsibly and purified through strict processes."}
            </Text>
            
            <View style={styles.timeline}>
              {steps.map((step, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDotBox}>
                    <View style={styles.timelineDot} />
                    {idx < steps.length - 1 && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
                  </View>
                  <View style={[styles.timelineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={styles.stepNum}>{step.num}</Text>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                    <Text style={[styles.stepDesc, { color: theme.textMuted }]}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FACTORY INFRASTRUCTURE */}
        {subSection === 'factory' && (
          <View style={styles.animateContainer}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>State-Of-The-Art plant</Text>
              <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
                {companyInfo.InfrastructureText}
              </Text>
            </View>

            <View style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.locationLabel, { color: theme.text }]}>Manufacturing Facility</Text>
              <Text style={[styles.locationAddr, { color: theme.textMuted }]}>{companyInfo.PlantAddress}</Text>
              <TouchableOpacity 
                style={[styles.mapBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => handleOpenMap('plant')}
              >
                <Text style={styles.mapBtnText}>Open Plant in Google Maps</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.locationLabel, { color: theme.text }]}>Corporate Office</Text>
              <Text style={[styles.locationAddr, { color: theme.textMuted }]}>{companyInfo.OfficeAddress}</Text>
              <TouchableOpacity 
                style={[styles.mapBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => handleOpenMap('office')}
              >
                <Text style={styles.mapBtnText}>Open Office in Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  animateContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
  },

  /* Timeline */
  timelineIntro: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDotBox: {
    width: 24,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginTop: 18,
    zIndex: 10,
  },
  timelineLine: {
    position: 'absolute',
    top: 30,
    bottom: -30,
    width: 2,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginLeft: 12,
    position: 'relative',
  },
  stepNum: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 11,
    lineHeight: 15,
  },

  /* Plant Address and Maps */
  locationCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  locationAddr: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  mapBtn: {
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
  },
  mapBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
