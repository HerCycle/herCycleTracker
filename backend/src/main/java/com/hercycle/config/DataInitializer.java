package com.hercycle.config;

import com.hercycle.entity.SelfCare;
import com.hercycle.entity.SelfCareCategory;
import com.hercycle.repository.SelfCareRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    private final SelfCareRepository selfCareRepository;

    public DataInitializer(SelfCareRepository selfCareRepository) {
        this.selfCareRepository = selfCareRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (selfCareRepository.count() == 0) {
            logger.info("Seeding initial Self-Care video data...");

            // Nutrition videos
            SelfCare n1 = SelfCare.builder().title("Nutrition & Diet Guide for Period & PCOS Management").description("Essential dietary and nutrition guidance.").category(SelfCareCategory.NUTRITION).thumbnail("https://img.youtube.com/vi/1SD_29gnFu0/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=1SD_29gnFu0").build();
            SelfCare n2 = SelfCare.builder().title("Healthy Eating During Menstrual Cycle").description("Foods to boost iron, reduce bloating.").category(SelfCareCategory.NUTRITION).thumbnail("https://img.youtube.com/vi/caBhbgF2kHs/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=caBhbgF2kHs").build();
            SelfCare n3 = SelfCare.builder().title("PCOS Diet & Nutrition Strategies").description("Nutritional advice for managing insulin resistance.").category(SelfCareCategory.NUTRITION).thumbnail("https://img.youtube.com/vi/YdAb7FYUW5A/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=YdAb7FYUW5A").build();
            SelfCare n4 = SelfCare.builder().title("Best Foods for Menstrual Cramps").description("Natural foods that help soothe cramps.").category(SelfCareCategory.NUTRITION).thumbnail("https://img.youtube.com/vi/r5FlXjSOJAA/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=r5FlXjSOJAA").build();
            SelfCare n5 = SelfCare.builder().title("Cycle Syncing Nutrition & Meal Plan").description("How to adapt your diet to cycle phases.").category(SelfCareCategory.NUTRITION).thumbnail("https://img.youtube.com/vi/vU5f1OAisWM/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=vU5f1OAisWM").build();
            SelfCare n6 = SelfCare.builder().title("Essential Vitamins & Minerals for Women").description("Key nutrients every woman needs.").category(SelfCareCategory.NUTRITION).thumbnail("https://img.youtube.com/vi/79uXzgtMGsM/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=79uXzgtMGsM").build();

            // Exercise videos
            SelfCare e1 = SelfCare.builder().title("Gentle Yoga Routine for Period Pain").description("Soothe cramps and lower back ache.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/S4UfZ2TV_uA/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=S4UfZ2TV_uA").build();
            SelfCare e2 = SelfCare.builder().title("Low Impact Exercise for Bleeding Phase").description("Gentle movement to boost energy.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/4JaCcp39iVI/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=4JaCcp39iVI").build();
            SelfCare e3 = SelfCare.builder().title("Pelvic Floor & Core Relief Exercises").description("Targeted pelvic exercises.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/evQcsWf54qY/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=evQcsWf54qY").build();
            SelfCare e4 = SelfCare.builder().title("Full Body Stretches for PMS & Fatigue").description("Relaxing full body stretch routine.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/ptC6gK3QbLg/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=ptC6gK3QbLg").build();
            SelfCare e5 = SelfCare.builder().title("Yoga & Breathing for Hormonal Balance").description("Calming yoga flows for stress reduction.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/pubczv0pOrc/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=pubczv0pOrc").build();
            SelfCare e6 = SelfCare.builder().title("Luteal Phase Exercise & Movement Guide").description("Adjusting workout intensity.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/jBnf12rYBKg/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=jBnf12rYBKg").build();
            SelfCare e7 = SelfCare.builder().title("Quick 10-Min Relief Workout for Cramps").description("Fast, effective movements.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/VaVIvmQx_Xw/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=VaVIvmQx_Xw").build();
            SelfCare e8 = SelfCare.builder().title("Bedtime Stretches for Period Comfort").description("Soothing nighttime stretches.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/-nFUNjxhGMs/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=-nFUNjxhGMs").build();
            SelfCare e9 = SelfCare.builder().title("Gentle Pilates for Women's Health").description("Low-intensity Pilates routine.").category(SelfCareCategory.EXERCISE).thumbnail("https://img.youtube.com/vi/5JvbjrLESPs/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=5JvbjrLESPs").build();

            // Hygiene video
            SelfCare h1 = SelfCare.builder().title("Essential Menstrual Hygiene Practices").description("Important sanitary tips.").category(SelfCareCategory.HYGIENE).thumbnail("https://img.youtube.com/vi/1SD_29gnFu0/hqdefault.jpg").youtubeUrl("https://www.youtube.com/watch?v=1SD_29gnFu0").build();

            selfCareRepository.saveAll(Arrays.asList(n1, n2, n3, n4, n5, n6, e1, e2, e3, e4, e5, e6, e7, e8, e9, h1));
            logger.info("Successfully seeded Nutrition, Exercise, and Hygiene videos.");
        }
    }
}
